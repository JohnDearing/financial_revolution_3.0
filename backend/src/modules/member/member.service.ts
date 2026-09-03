import Stripe from "stripe";
import { assertStripeConfigured, env, stripe } from "../../config/index.js";
import {
  findMembershipById,
  findUserByEmail,
  findUserById,
  getMembershipByUserId,
  getUserWithMembership,
  listMembershipsWithUsers,
  updateMembershipById,
  updateUserById,
} from "../../data/store.js";
import { prisma } from "../../lib/prisma.js";
import {
  getMemberCommunityAccess,
  onMembershipActivated,
  onMembershipCanceled,
  onMembershipPastDue,
  sendMembershipWelcomeNotifications,
  sendSubscriptionRenewalEmail,
} from "../../services/membership-notifications.service.js";
import { getMemberTelegramAccess } from "../../services/telegram-access.service.js";
import type { MembershipStatus } from "../../types/domain.js";
import { HttpError } from "../../utils/httpError.js";

type MembershipRecord = {
  id: string;
  userId: string;
  status: MembershipStatus;
  enrollmentPaid: boolean;
  monthlyStartsAt?: string | Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  telegramInvitedAt?: string | Date | null;
  telegramInviteLink?: string | null;
  canceledAt?: string | Date | null;
};

const addDays = (date: Date, days: number): Date => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
};

const findMembershipForStripe = async (params: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) => {
  if (params.userId) {
    const byUser = await getMembershipByUserId(params.userId);
    if (byUser) return byUser;
  }

  if (params.subscriptionId) {
    const bySubscription = await prisma.membership.findFirst({
      where: { stripeSubscriptionId: params.subscriptionId },
    });
    if (bySubscription) return bySubscription;
  }

  if (params.customerId) {
    return prisma.membership.findFirst({
      where: { stripeCustomerId: params.customerId },
    });
  }

  return null;
};

const getInvoiceUserId = (invoice: Stripe.Invoice) => {
  const fromParent =
    invoice.parent?.subscription_details?.metadata?.userId ??
    invoice.parent?.subscription_details?.metadata?.user_id;
  if (fromParent) return fromParent;

  const subscription = invoice.parent?.subscription_details?.subscription;
  if (typeof subscription === "string") return undefined;
  return subscription?.metadata?.userId;
};

export const setMembershipStatus = async (
  membership: MembershipRecord,
  status: MembershipStatus,
  options?: {
    notifyReason?: "checkout" | "restored" | "status_sync" | "past_due" | "canceled";
    sendRenewalReceipt?: {
      amount: string;
      invoiceDate: string;
    };
  },
) => {
  const previousStatus = membership.status;
  if (previousStatus === status && !options?.sendRenewalReceipt) {
    return membership;
  }

  await updateMembershipById(membership.id, { status });
  membership.status = status;

  try {
    if (status === "active" && previousStatus !== "active") {
      await onMembershipActivated({
        membership,
        previousStatus,
        reason:
          options?.notifyReason === "checkout"
            ? "checkout"
            : previousStatus === "past_due" || options?.notifyReason === "restored"
              ? "restored"
              : "status_sync",
      });
    } else if (status === "active" && options?.sendRenewalReceipt) {
      await sendSubscriptionRenewalEmail({
        userId: membership.userId,
        amount: options.sendRenewalReceipt.amount,
        invoiceDate: options.sendRenewalReceipt.invoiceDate,
      });
    }

    if (status === "past_due" && previousStatus !== "past_due") {
      await onMembershipPastDue(membership);
    }

    if (
      (status === "canceled" || status === "inactive") &&
      previousStatus !== status
    ) {
      await onMembershipCanceled(membership);
    }
  } catch (error) {
    console.error("[membership-notifications]", {
      membershipId: membership.id,
      status,
      error,
    });
  }

  return membership;
};

export const getCurrentMemberProfile = async (userId: string) => {
  const user = await getUserWithMembership(userId);
  const membership = user?.memberships[0];
  if (!user || !membership) throw new HttpError(404, "Member not found");
  const community = await getMemberCommunityAccess(userId);
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
    membership,
    community,
  };
};

export const updateCurrentMemberProfile = async (
  userId: string,
  input: { fullName?: string; email?: string },
) => {
  const user = await findUserById(userId);
  if (!user) throw new HttpError(404, "Member not found");

  const fullName = input.fullName?.trim();
  const email = input.email?.trim().toLowerCase();

  if (fullName !== undefined && fullName.length < 2) {
    throw new HttpError(400, "Full name must be at least 2 characters");
  }

  if (email && email !== user.email) {
    const existing = await findUserByEmail(email);
    if (existing) throw new HttpError(409, "Email is already in use");
  }

  const updated = await updateUserById(userId, {
    ...(fullName ? { fullName } : {}),
    ...(email && email !== user.email
      ? {
          email,
          isEmailVerified: false,
          emailVerifiedAt: null,
        }
      : {}),
  });

  return {
    id: updated.id,
    email: updated.email,
    fullName: updated.fullName,
    role: updated.role,
    isEmailVerified: updated.isEmailVerified,
  };
};

/**
 * Fallback when Stripe webhooks do not reach this server (common in local dev).
 * Verifies the Checkout Session with Stripe, activates membership, and sends
 * the enrollment welcome email + Telegram invites if not already sent.
 */
export const confirmCheckoutSessionForMember = async (
  userId: string,
  sessionId: string,
) => {
  if (!stripe) {
    throw new HttpError(503, "Stripe is not configured");
  }
  if (!sessionId?.startsWith("cs_")) {
    throw new HttpError(400, "Valid Stripe checkout session_id is required");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const sessionUserId = session.metadata?.userId ?? session.client_reference_id;
  if (sessionUserId && sessionUserId !== userId) {
    throw new HttpError(403, "This checkout session belongs to another account");
  }

  const paid =
    session.payment_status === "paid" ||
    session.status === "complete" ||
    session.payment_status === "no_payment_required";

  if (!paid) {
    throw new HttpError(400, "Checkout payment is not completed yet");
  }

  const membership = await getMembershipByUserId(userId);
  if (!membership) throw new HttpError(404, "Member not found");

  const previousStatus = membership.status;
  const monthlyStartsAt = membership.monthlyStartsAt ?? addDays(new Date(), 30);

  await updateMembershipById(membership.id, {
    enrollmentPaid: true,
    status: "active",
    stripeCustomerId: session.customer?.toString() ?? membership.stripeCustomerId,
    stripeSubscriptionId:
      session.subscription?.toString() ?? membership.stripeSubscriptionId,
    stripeCheckoutSessionId: session.id,
    monthlyStartsAt,
    canceledAt: null,
  });

  membership.enrollmentPaid = true;
  membership.status = "active";
  membership.stripeCustomerId =
    session.customer?.toString() ?? membership.stripeCustomerId;
  membership.stripeSubscriptionId =
    session.subscription?.toString() ?? membership.stripeSubscriptionId;
  membership.monthlyStartsAt = monthlyStartsAt;
  membership.stripeCheckoutSessionId = session.id;

  if (previousStatus !== "active") {
    await setMembershipStatus(membership, "active", { notifyReason: "checkout" });
  } else {
    // Webhook may have activated membership without delivering email (e.g. remote deploy).
    await sendMembershipWelcomeNotifications(membership);
  }

  const telegram = await getMemberTelegramAccess(userId);

  return {
    membershipStatus: "active" as const,
    enrollmentPaid: true,
    sessionId: session.id,
    telegram: {
      groupInviteLink: telegram?.group.inviteLink ?? null,
      channelInviteLink: telegram?.channel.inviteLink ?? null,
      invitationStatus: telegram?.invitationStatus ?? null,
    },
  };
};

export const createCheckoutSessionForMember = async (userId: string) => {
  const user = await findUserById(userId);
  const membership = await getMembershipByUserId(userId);
  if (!user || !membership) throw new HttpError(404, "Member not found");

  if (membership.enrollmentPaid && membership.status === "active") {
    throw new HttpError(409, "Membership is already active");
  }

  if (!stripe || !env.stripeEnrollmentPriceId || !env.stripeMonthlyPriceId) {
    throw new HttpError(
      503,
      "Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs.",
    );
  }

  const stripeClient = assertStripeConfigured();

  let customerId = membership.stripeCustomerId ?? undefined;
  if (customerId) {
    try {
      await stripeClient.customers.retrieve(customerId);
    } catch {
      customerId = undefined;
    }
  }

  if (!customerId) {
    const customer = await stripeClient.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: { userId, project: "financial-revolution-3.0" },
    });
    customerId = customer.id;
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    success_url: `${env.frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendUrl}/billing/cancel`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    line_items: membership.enrollmentPaid
      ? [{ price: env.stripeMonthlyPriceId, quantity: 1 }]
      : [
          { price: env.stripeEnrollmentPriceId, quantity: 1 },
          { price: env.stripeMonthlyPriceId, quantity: 1 },
        ],
    subscription_data: {
      ...(membership.enrollmentPaid ? {} : { trial_period_days: 30 }),
      metadata: { userId, project: "financial-revolution-3.0" },
    },
    metadata: { userId, project: "financial-revolution-3.0" },
  });

  if (!session.url) {
    throw new HttpError(500, "Unable to create Stripe Checkout URL");
  }

  await updateMembershipById(membership.id, {
    stripeCustomerId: customerId,
    stripeCheckoutSessionId: session.id,
  });

  return {
    mode: "stripe" as const,
    sessionId: session.id,
    checkoutUrl: session.url,
  };
};

const formatMoney = (amount: number | null | undefined, currency = "usd") => {
  const value = (amount ?? 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
};

const readDefaultCard = async (customerId: string) => {
  if (!stripe) {
    return { cardBrand: "card", cardLast4: "----" };
  }

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    return { cardBrand: "card", cardLast4: "----" };
  }

  const defaultPaymentMethod =
    typeof customer.invoice_settings?.default_payment_method === "string"
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id;

  if (!defaultPaymentMethod) {
    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 1,
    });
    const card = methods.data[0]?.card;
    return {
      cardBrand: card?.brand ?? "card",
      cardLast4: card?.last4 ?? "----",
    };
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethod);
  return {
    cardBrand: paymentMethod.card?.brand ?? "card",
    cardLast4: paymentMethod.card?.last4 ?? "----",
  };
};

export const getMemberBillingSummary = async (userId: string) => {
  const user = await findUserById(userId);
  const membership = await getMembershipByUserId(userId);
  if (!user || !membership) throw new HttpError(404, "Member not found");

  let cardBrand = "card";
  let cardLast4 = "----";
  let nextChargeDate: string | null =
    membership.monthlyStartsAt?.toISOString().slice(0, 10) ?? null;
  let cancelAtPeriodEnd = false;
  let currentPeriodEnd: string | null = null;
  let stripeStatus: string | null = null;

  if (stripe && membership.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        membership.stripeSubscriptionId,
      );
      stripeStatus = subscription.status;
      cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
      const periodEndUnix =
        subscription.items.data[0]?.current_period_end ??
        subscription.cancel_at ??
        null;
      currentPeriodEnd = periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString().slice(0, 10)
        : null;
      nextChargeDate = cancelAtPeriodEnd ? null : currentPeriodEnd;
    } catch {
      // Keep DB membership values when Stripe lookup fails.
    }
  }

  if (stripe && membership.stripeCustomerId) {
    try {
      const card = await readDefaultCard(membership.stripeCustomerId);
      cardBrand = card.cardBrand;
      cardLast4 = card.cardLast4;
    } catch {
      // Ignore card lookup failures.
    }
  }

  const needsEnrollment =
    !membership.enrollmentPaid ||
    membership.status === "pending" ||
    membership.status === "canceled" ||
    membership.status === "inactive";

  const { getPlatformSettings } = await import(
    "../../services/platform-settings.service.js"
  );
  const settings = await getPlatformSettings();

  return {
    planName: settings.defaultPlanName,
    planPrice: settings.monthlyPriceLabel,
    enrollmentFee: settings.enrollmentFeeLabel,
    enrollmentPaid: membership.enrollmentPaid,
    membershipStatus: membership.status,
    subscriptionStatus: membership.status,
    needsEnrollment,
    monthlyStartsAt: membership.monthlyStartsAt?.toISOString() ?? null,
    nextChargeDate,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    stripeStatus,
    cardBrand,
    cardLast4,
    hasStripeCustomer: Boolean(membership.stripeCustomerId),
    hasStripeSubscription: Boolean(membership.stripeSubscriptionId),
  };
};

export const createBillingPortalSession = async (userId: string) => {
  const membership = await getMembershipByUserId(userId);
  if (!membership) throw new HttpError(404, "Member not found");
  if (!membership.stripeCustomerId) {
    throw new HttpError(400, "No Stripe customer found. Complete enrollment first.");
  }
  if (!stripe) {
    throw new HttpError(503, "Stripe is not configured");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: membership.stripeCustomerId,
    return_url: `${env.frontendUrl}/member/billing`,
  });

  return { portalUrl: session.url };
};

export const cancelMemberSubscription = async (userId: string) => {
  const { getPlatformSettings } = await import(
    "../../services/platform-settings.service.js"
  );
  const settings = await getPlatformSettings();
  if (!settings.allowMemberSelfCancel) {
    throw new HttpError(
      403,
      "Self-service cancellation is disabled. Contact support to cancel.",
    );
  }

  const membership = await getMembershipByUserId(userId);
  if (!membership) throw new HttpError(404, "Member not found");

  if (!membership.stripeSubscriptionId) {
    await updateMembershipById(membership.id, {
      status: "canceled",
      canceledAt: new Date(),
    });
    return {
      message: "Membership marked as canceled.",
      membershipStatus: "canceled" as const,
      cancelAtPeriodEnd: false,
    };
  }

  if (!stripe) {
    throw new HttpError(503, "Stripe is not configured");
  }

  const subscription = await stripe.subscriptions.update(
    membership.stripeSubscriptionId,
    { cancel_at_period_end: true },
  );

  await updateMembershipById(membership.id, {
    canceledAt: new Date(),
  });

  const periodEndUnix =
    subscription.items.data[0]?.current_period_end ??
    subscription.cancel_at ??
    null;

  return {
    message: "Subscription will cancel at the end of the current billing period.",
    membershipStatus: membership.status,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    currentPeriodEnd: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString().slice(0, 10)
      : undefined,
  };
};

export const getMemberPaymentHistory = async (
  userId: string,
  pageInput = 1,
  pageSize = 5,
) => {
  const membership = await getMembershipByUserId(userId);
  if (!membership) throw new HttpError(404, "Member not found");

  const page = Number.isFinite(pageInput) && pageInput > 0 ? Math.floor(pageInput) : 1;

  if (!stripe || !membership.stripeCustomerId) {
    return {
      items: [],
      page: 1,
      pageSize,
      total: 0,
      totalPages: 1,
    };
  }

  const invoices = await stripe.invoices.list({
    customer: membership.stripeCustomerId,
    limit: 100,
  });

  const items = invoices.data.map((invoice) => {
    const status =
      invoice.status === "paid"
        ? "paid"
        : invoice.status === "open"
          ? "pending"
          : invoice.status === "uncollectible"
            ? "failed"
            : invoice.status === "void"
              ? "refunded"
              : "pending";

    return {
      id: invoice.id,
      date: new Date((invoice.created ?? 0) * 1000).toISOString().slice(0, 10),
      description:
        invoice.lines.data[0]?.description ??
        invoice.description ??
        "Membership invoice",
      amount: formatMoney(invoice.amount_paid || invoice.total, invoice.currency),
      status: status as "paid" | "pending" | "failed" | "refunded",
      method: "Stripe",
    };
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: currentPage,
    pageSize,
    total,
    totalPages,
  };
};

const onCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  const membership = await findMembershipForStripe({
    userId,
    customerId: session.customer?.toString() ?? null,
    subscriptionId: session.subscription?.toString() ?? null,
  });
  if (!membership) return;

  await updateMembershipById(membership.id, {
    enrollmentPaid: true,
    stripeCustomerId: session.customer?.toString() ?? membership.stripeCustomerId,
    stripeSubscriptionId:
      session.subscription?.toString() ?? membership.stripeSubscriptionId,
    stripeCheckoutSessionId: session.id,
    monthlyStartsAt: addDays(new Date(), 30),
    canceledAt: null,
  });

  membership.enrollmentPaid = true;
  membership.stripeCustomerId =
    session.customer?.toString() ?? membership.stripeCustomerId;
  membership.stripeSubscriptionId =
    session.subscription?.toString() ?? membership.stripeSubscriptionId;
  membership.monthlyStartsAt = addDays(new Date(), 30);
  await setMembershipStatus(membership, "active", { notifyReason: "checkout" });
};

const onSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
  const membership = await findMembershipForStripe({
    userId: subscription.metadata?.userId,
    customerId: subscription.customer?.toString() ?? null,
    subscriptionId: subscription.id,
  });
  if (!membership) return;

  await updateMembershipById(membership.id, {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer?.toString() ?? membership.stripeCustomerId,
  });

  const status = subscription.status;
  if (status === "active" || status === "trialing") {
    await setMembershipStatus(membership, "active");
    return;
  }
  if (status === "past_due" || status === "unpaid") {
    await setMembershipStatus(membership, "past_due");
    return;
  }
  if (status === "canceled" || status === "incomplete_expired") {
    await updateMembershipById(membership.id, { canceledAt: new Date() });
    membership.canceledAt = new Date();
    await setMembershipStatus(membership, "canceled");
  }
};

const onSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  const membership = await findMembershipForStripe({
    userId: subscription.metadata?.userId,
    customerId: subscription.customer?.toString() ?? null,
    subscriptionId: subscription.id,
  });
  if (!membership) return;

  await updateMembershipById(membership.id, {
    canceledAt: new Date(),
    stripeSubscriptionId: subscription.id,
  });

  membership.canceledAt = new Date();
  membership.stripeSubscriptionId = subscription.id;
  await setMembershipStatus(membership, "canceled");
};

export const processStripeMembershipEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const membership = await findMembershipForStripe({
        userId: getInvoiceUserId(invoice),
        customerId: invoice.customer?.toString() ?? null,
        subscriptionId:
          typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : invoice.parent?.subscription_details?.subscription?.id ?? null,
      });
      if (!membership) break;
      await setMembershipStatus(membership, "past_due", {
        notifyReason: "past_due",
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const membership = await findMembershipForStripe({
        userId: getInvoiceUserId(invoice),
        customerId: invoice.customer?.toString() ?? null,
        subscriptionId:
          typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : invoice.parent?.subscription_details?.subscription?.id ?? null,
      });
      if (!membership) break;

      const previousStatus = membership.status;
      const amount = formatMoney(
        invoice.amount_paid || invoice.total,
        invoice.currency,
      );
      const invoiceDate = new Date((invoice.created ?? 0) * 1000)
        .toISOString()
        .slice(0, 10);
      const billingReason = invoice.billing_reason;
      const isRenewalCycle = billingReason === "subscription_cycle";

      if (previousStatus === "past_due") {
        await setMembershipStatus(membership, "active", {
          notifyReason: "restored",
        });
      } else if (previousStatus === "active" && isRenewalCycle) {
        await setMembershipStatus(membership, "active", {
          sendRenewalReceipt: { amount, invoiceDate },
        });
      } else {
        // checkout.session.completed owns the welcome email for first payment.
        await setMembershipStatus(membership, "active", {
          notifyReason: "status_sync",
        });
      }
      break;
    }
    default:
      break;
  }
};

export const listAllMemberships = async () => {
  const records = await listMembershipsWithUsers();
  return records.map((membership) => {
    const user = membership.user;
    return {
      membershipId: membership.id,
      status: membership.status,
      enrollmentPaid: membership.enrollmentPaid,
      monthlyStartsAt: membership.monthlyStartsAt,
      user: user
        ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          }
        : null,
    };
  });
};

export const findMembershipByIdOrThrow = async (membershipId: string) => {
  const membership = await findMembershipById(membershipId);
  if (!membership) throw new HttpError(404, "Membership not found");
  return {
    ...membership,
    monthlyStartsAt: membership.monthlyStartsAt?.toISOString(),
    telegramInvitedAt: membership.telegramInvitedAt?.toISOString(),
    telegramInviteLink: membership.telegramInviteLink,
    canceledAt: membership.canceledAt?.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
  };
};
