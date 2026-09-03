import { env } from "../config/index.js";
import { findUserById, getMembershipByUserId } from "../data/store.js";
import {
  membershipCanceledEmailTemplate,
  membershipRestoredEmailTemplate,
  membershipWelcomeEmailTemplate,
  paymentFailedEmailTemplate,
  subscriptionRenewalEmailTemplate,
} from "../emails/templates.js";
import { getPlatformSettings } from "./platform-settings.service.js";
import {
  getMemberTelegramAccess,
  grantTelegramAccess,
  hasWelcomeEmailBeenSent,
  markWelcomeEmailSent,
  revokeTelegramAccess,
  syncTelegramForMembershipChange,
} from "./telegram-access.service.js";
import { isTelegramAccessConfigured } from "./telegram.service.js";
import { sendEmail } from "../utils/smtp.js";

type MembershipLike = {
  id: string;
  userId: string;
  status: string;
  enrollmentPaid: boolean;
  monthlyStartsAt?: string | Date | null;
  telegramInvitedAt?: string | Date | null;
  telegramInviteLink?: string | null;
  canceledAt?: string | Date | null;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "About 30 days after enrollment";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "About 30 days after enrollment";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function sendMembershipWelcomeNotifications(
  membership: MembershipLike,
  options?: { force?: boolean },
) {
  const user = await findUserById(membership.userId);
  if (!user) return { sent: false as const, reason: "user_not_found" };

  if (!options?.force && (await hasWelcomeEmailBeenSent(membership.userId))) {
    await grantTelegramAccess(membership.userId, "status_sync");
    return { sent: false as const, reason: "already_sent" };
  }

  await syncTelegramForMembershipChange({
    userId: membership.userId,
    previousStatus: "pending",
    nextStatus: "active",
    reason: "checkout",
  });

  const settings = await getPlatformSettings();
  if (!settings.emailWelcomeEnabled) {
    return { sent: false as const, reason: "disabled" };
  }

  const telegram = await getMemberTelegramAccess(membership.userId);
  const groupInviteLink =
    telegram?.group.inviteLink ?? env.telegramGroupInviteLink;
  const channelInviteLink =
    telegram?.channel.inviteLink ?? env.telegramChannelInviteLink;

  const template = membershipWelcomeEmailTemplate({
    fullName: user.fullName,
    planName: settings.defaultPlanName,
    enrollmentFee: settings.enrollmentFeeLabel,
    monthlyPrice: settings.monthlyPriceLabel,
    monthlyStartsAt: formatDate(membership.monthlyStartsAt),
    groupName: env.telegramGroupName,
    channelName: env.telegramChannelName,
    groupInviteLink,
    channelInviteLink,
    awaitingConnection: telegram?.invitationStatus === "awaiting_connection",
  });

  const emailResult = await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });

  if (emailResult.delivered) {
    await markWelcomeEmailSent(membership.userId);
  }

  return {
    sent: emailResult.delivered,
    reason: emailResult.delivered ? "sent" : emailResult.reason,
    groupInviteLink,
    channelInviteLink,
  };
}

export async function onMembershipActivated(params: {
  membership: MembershipLike;
  previousStatus: string;
  reason: "checkout" | "restored" | "status_sync";
}) {
  const { membership, previousStatus, reason } = params;

  if (reason === "checkout") {
    await sendMembershipWelcomeNotifications(membership);
    return;
  }

  await syncTelegramForMembershipChange({
    userId: membership.userId,
    previousStatus,
    nextStatus: "active",
    reason: reason === "restored" ? "restored" : "status_sync",
  });

  if (reason === "restored" || previousStatus === "past_due") {
    const settings = await getPlatformSettings();
    if (!settings.emailRestoredEnabled) return;

    const user = await findUserById(membership.userId);
    if (!user) return;
    const telegram = await getMemberTelegramAccess(membership.userId);
    const template = membershipRestoredEmailTemplate({
      fullName: user.fullName,
      groupInviteLink:
        telegram?.group.inviteLink ?? env.telegramGroupInviteLink,
      channelInviteLink:
        telegram?.channel.inviteLink ?? env.telegramChannelInviteLink,
      awaitingConnection: telegram?.invitationStatus === "awaiting_connection",
    });
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });
  }
}

export async function onMembershipPastDue(membership: MembershipLike) {
  const user = await findUserById(membership.userId);
  if (!user) return;

  const settings = await getPlatformSettings();
  if (settings.revokeTelegramOnPastDue) {
    await revokeTelegramAccess(membership.userId, "canceled");
  }

  if (!settings.emailPaymentFailedEnabled) return;

  const template = paymentFailedEmailTemplate({
    fullName: user.fullName,
    planName: settings.defaultPlanName,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
}

export async function onMembershipCanceled(membership: MembershipLike) {
  const user = await findUserById(membership.userId);
  if (!user) return;

  const settings = await getPlatformSettings();
  if (settings.revokeTelegramOnCancel) {
    await revokeTelegramAccess(
      membership.userId,
      membership.status === "inactive" ? "admin" : "period_end",
    );
  }

  if (!settings.emailCanceledEnabled) return;

  const template = membershipCanceledEmailTemplate({
    fullName: user.fullName,
    endsOn: membership.canceledAt ? formatDate(membership.canceledAt) : null,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendSubscriptionRenewalEmail(params: {
  userId: string;
  amount: string;
  invoiceDate: string;
}) {
  const user = await findUserById(params.userId);
  if (!user) return;

  await grantTelegramAccess(params.userId, "status_sync");

  const settings = await getPlatformSettings();
  if (!settings.emailRenewalEnabled) return;

  const template = subscriptionRenewalEmailTemplate({
    fullName: user.fullName,
    amount: params.amount,
    invoiceDate: params.invoiceDate,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
}

export async function getMemberCommunityAccess(userId: string) {
  const membership = await getMembershipByUserId(userId);
  if (!membership) return null;
  const telegram = await getMemberTelegramAccess(userId);
  if (!telegram) return null;

  return {
    unlocked: telegram.unlocked,
    status: membership.status,
    enrollmentPaid: membership.enrollmentPaid,
    communityName: `${env.telegramGroupName} + ${env.telegramChannelName}`,
    groupName: env.telegramGroupName,
    channelName: env.telegramChannelName,
    inviteLink: telegram.group.inviteLink,
    groupInviteLink: telegram.group.inviteLink,
    channelInviteLink: telegram.channel.inviteLink,
    invitedAt: telegram.lastInvitedAt,
    telegramConfigured: isTelegramAccessConfigured(),
    botConfigured: telegram.botConfigured,
    connectionStatus: telegram.connectionStatus,
    invitationStatus: telegram.invitationStatus,
    telegramUsername: telegram.telegramUsername,
    canConnect: telegram.canConnect,
    history: telegram.history,
  };
}
