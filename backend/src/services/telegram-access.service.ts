import type { Prisma } from "@prisma/client";
import { env } from "../config/index.js";
import { prisma } from "../lib/prisma.js";
import { createOpaqueToken, hashToken, minutesFromNow } from "../utils/crypto.js";
import { HttpError } from "../utils/httpError.js";
import { sendEmail } from "../utils/smtp.js";
import { telegramInviteEmailTemplate } from "../emails/templates.js";
import {
  createChatInviteLink,
  getTelegramCommunityLabel,
  isPersonalInviteLink,
  isTelegramAccessConfigured,
  isTelegramBotConfigured,
  kickTelegramMember,
  revokeChatInviteLink,
  sendTelegramDirectMessage,
  unbanTelegramMember,
} from "./telegram.service.js";

async function memberEligibleForTelegram(membership: {
  enrollmentPaid: boolean;
  status: string;
}) {
  const { getPlatformSettings } = await import("./platform-settings.service.js");
  const settings = await getPlatformSettings();
  if (!settings.requireActiveMembershipForTelegram) {
    return membership.enrollmentPaid;
  }
  return membership.enrollmentPaid && membership.status === "active";
}

async function ensureConnection(userId: string) {
  return prisma.telegramConnection.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function logEvent(params: {
  connectionId: string;
  userId: string;
  action: string;
  target?: string;
  detail?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.telegramAccessEvent.create({
    data: {
      connectionId: params.connectionId,
      userId: params.userId,
      action: params.action,
      target: params.target,
      detail: params.detail,
      metadata: params.metadata,
    },
  });
}

function metadataFlag(
  metadata: Prisma.JsonValue | null | undefined,
  key: string,
) {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      !Array.isArray(metadata) &&
      (metadata as Record<string, unknown>)[key] === true,
  );
}

async function hasDurablePersonalInvites(
  userId: string,
  connection: {
    groupAccessActive: boolean;
    channelAccessActive: boolean;
    groupInviteLink: string | null;
    channelInviteLink: string | null;
  },
) {
  if (
    !connection.groupAccessActive ||
    !connection.channelAccessActive ||
    !isPersonalInviteLink("group", connection.groupInviteLink) ||
    !isPersonalInviteLink("channel", connection.channelInviteLink)
  ) {
    return false;
  }

  const lastGrant = await prisma.telegramAccessEvent.findFirst({
    where: {
      userId,
      action: { in: ["access_granted", "access_restored"] },
    },
    orderBy: { createdAt: "desc" },
    select: { metadata: true },
  });

  return metadataFlag(lastGrant?.metadata, "neverExpires");
}

export async function markTelegramEligible(userId: string) {
  const connection = await ensureConnection(userId);
  if (
    connection.invitationStatus === "not_eligible" ||
    connection.invitationStatus === "access_revoked"
  ) {
    await prisma.telegramConnection.update({
      where: { id: connection.id },
      data: {
        invitationStatus:
          connection.telegramUserId && connection.connectionStatus === "connected"
            ? connection.invitationStatus
            : "awaiting_connection",
        accessRevokedAt: null,
      },
    });
  }
  await logEvent({
    connectionId: connection.id,
    userId,
    action: "eligible",
    target: "account",
    detail: "Membership active — Telegram access available after Connect",
  });
}

export async function createTelegramConnectSession(userId: string) {
  if (!isTelegramBotConfigured()) {
    throw new HttpError(
      503,
      "Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME.",
    );
  }

  const membership = await prisma.membership.findUnique({ where: { userId } });
  if (!membership) throw new HttpError(404, "Membership not found");
  if (!(await memberEligibleForTelegram(membership))) {
    throw new HttpError(
      403,
      "Telegram access is only available to active paid members.",
    );
  }

  const connection = await ensureConnection(userId);
  const rawToken = createOpaqueToken(24);
  const expiresAt = minutesFromNow(30);

  await prisma.telegramConnection.update({
    where: { id: connection.id },
    data: {
      connectTokenHash: hashToken(rawToken),
      connectTokenExpiresAt: expiresAt,
      invitationStatus:
        connection.invitationStatus === "not_eligible"
          ? "awaiting_connection"
          : connection.invitationStatus,
    },
  });

  await logEvent({
    connectionId: connection.id,
    userId,
    action: "connect_started",
    target: "account",
    detail: "Secure Connect Telegram session created",
  });

  const deepLink = `https://t.me/${env.telegramBotUsername}?start=fr3_${rawToken}`;

  return {
    deepLink,
    expiresAt: expiresAt.toISOString(),
    botUsername: env.telegramBotUsername,
  };
}

export async function completeTelegramConnectFromBot(params: {
  rawToken: string;
  telegramUserId: string;
  telegramUsername?: string | null;
  telegramFirstName?: string | null;
  telegramLastName?: string | null;
}) {
  const tokenHash = hashToken(params.rawToken);
  const connection = await prisma.telegramConnection.findFirst({
    where: { connectTokenHash: tokenHash },
    include: { user: { include: { memberships: true } } },
  });

  if (!connection || !connection.connectTokenExpiresAt) {
    return { ok: false as const, message: "This connect link is invalid." };
  }
  if (connection.connectTokenExpiresAt < new Date()) {
    return { ok: false as const, message: "This connect link has expired. Generate a new one in the portal." };
  }

  const membership = connection.user.memberships[0];
  if (!membership || !(await memberEligibleForTelegram(membership))) {
    return {
      ok: false as const,
      message: "Your membership is not active. Complete payment first.",
    };
  }

  const existingOwner = await prisma.telegramConnection.findFirst({
    where: {
      telegramUserId: params.telegramUserId,
      NOT: { id: connection.id },
    },
  });
  if (existingOwner) {
    return {
      ok: false as const,
      message: "This Telegram account is already linked to another member.",
    };
  }

  await prisma.telegramConnection.update({
    where: { id: connection.id },
    data: {
      telegramUserId: params.telegramUserId,
      telegramUsername: params.telegramUsername ?? null,
      telegramFirstName: params.telegramFirstName ?? null,
      telegramLastName: params.telegramLastName ?? null,
      connectionStatus: "connected",
      connectedAt: connection.connectedAt ?? new Date(),
      connectTokenHash: null,
      connectTokenExpiresAt: null,
      invitationStatus: "awaiting_connection",
      accessRevokedAt: null,
    },
  });

  await logEvent({
    connectionId: connection.id,
    userId: connection.userId,
    action: "connected",
    target: "account",
    detail: `Linked Telegram @${params.telegramUsername ?? params.telegramUserId}`,
    metadata: {
      telegramUserId: params.telegramUserId,
      telegramUsername: params.telegramUsername,
    },
  });

  await grantTelegramAccess(connection.userId, "connect");

  return {
    ok: true as const,
    message:
      "Telegram connected. Your private group and channel invites are ready — check the portal and your email.",
  };
}

export async function grantTelegramAccess(
  userId: string,
  reason: "checkout" | "connect" | "restored" | "status_sync" = "status_sync",
) {
  const membership = await prisma.membership.findUnique({ where: { userId } });
  if (!membership || !(await memberEligibleForTelegram(membership))) {
    return null;
  }

  const connection = await ensureConnection(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const linked = Boolean(connection.telegramUserId);
  if (connection.telegramUserId) {
    await unbanTelegramMember("group", connection.telegramUserId);
    await unbanTelegramMember("channel", connection.telegramUserId);
  }

  const durableInvites = await hasDurablePersonalInvites(userId, connection);
  const reuseGroup =
    durableInvites && isPersonalInviteLink("group", connection.groupInviteLink);
  const reuseChannel =
    durableInvites &&
    isPersonalInviteLink("channel", connection.channelInviteLink);

  const label = `FR3 ${user.fullName}`.slice(0, 32);
  const [groupInvite, channelInvite] = await Promise.all([
    reuseGroup
      ? Promise.resolve({
          inviteLink: connection.groupInviteLink!,
          source: "existing" as const,
        })
      : createChatInviteLink({ target: "group", label: `${label} G` }),
    reuseChannel
      ? Promise.resolve({
          inviteLink: connection.channelInviteLink!,
          source: "existing" as const,
        })
      : createChatInviteLink({ target: "channel", label: `${label} C` }),
  ]);

  const issuedNew = !reuseGroup || !reuseChannel;

  // Only revoke a previous personal link when replacing it. Never revoke unused paid links.
  if (
    issuedNew &&
    !reuseGroup &&
    connection.groupInviteLink &&
    connection.groupInviteLink !== groupInvite.inviteLink
  ) {
    await revokeChatInviteLink("group", connection.groupInviteLink);
  }
  if (
    issuedNew &&
    !reuseChannel &&
    connection.channelInviteLink &&
    connection.channelInviteLink !== channelInvite.inviteLink
  ) {
    await revokeChatInviteLink("channel", connection.channelInviteLink);
  }

  const now = new Date();
  const invitationStatus = linked
    ? "access_granted"
    : isTelegramBotConfigured()
      ? "awaiting_connection"
      : "invites_sent";

  const updated = await prisma.telegramConnection.update({
    where: { id: connection.id },
    data: {
      groupInviteLink: groupInvite.inviteLink,
      channelInviteLink: channelInvite.inviteLink,
      groupAccessActive: true,
      channelAccessActive: true,
      invitationStatus,
      lastInvitedAt: issuedNew ? now : connection.lastInvitedAt ?? now,
      accessRevokedAt: null,
      connectionStatus: linked ? "connected" : connection.connectionStatus,
    },
  });

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      telegramInviteLink: groupInvite.inviteLink,
      telegramInvitedAt: membership.telegramInvitedAt ?? now,
    },
  });

  if (issuedNew || reason !== "status_sync") {
    await logEvent({
      connectionId: connection.id,
      userId,
      action: reason === "restored" ? "access_restored" : "access_granted",
      target: "both",
      detail: issuedNew
        ? linked
          ? "Single-use invites issued for group and channel (no expiry)"
          : "Paid-member single-use invites issued (no expiry). Connect Telegram still recommended."
        : "Existing unused paid invites reused — emailed links stay valid",
      metadata: {
        groupInvite: groupInvite.inviteLink,
        channelInvite: channelInvite.inviteLink,
        reason,
        linked,
        reused: !issuedNew,
        neverExpires: true,
      },
    });
  }

  if (connection.telegramUserId && issuedNew) {
    await sendTelegramDirectMessage(
      connection.telegramUserId,
      [
        "Financial Revolution 3.0 — access confirmed.",
        "",
        `Group: ${env.telegramGroupName}`,
        groupInvite.inviteLink,
        "",
        `Channel: ${env.telegramChannelName}`,
        channelInvite.inviteLink,
        "",
        "Each invite is for you only and does not expire until you join. Do not share them.",
      ].join("\n"),
    );
  }

  // Dedicated invite email after Connect; checkout/restored emails are separate.
  if (reason === "connect") {
    const template = telegramInviteEmailTemplate({
      fullName: user.fullName,
      groupName: env.telegramGroupName,
      channelName: env.telegramChannelName,
      groupInviteLink: groupInvite.inviteLink,
      channelInviteLink: channelInvite.inviteLink,
    });
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });
  }

  return {
    awaitingConnection: !linked && isTelegramBotConfigured(),
    groupInviteLink: updated.groupInviteLink,
    channelInviteLink: updated.channelInviteLink,
  };
}

export async function hasWelcomeEmailBeenSent(userId: string) {
  const existing = await prisma.telegramAccessEvent.findFirst({
    where: { userId, action: "welcome_email_sent" },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function markWelcomeEmailSent(userId: string) {
  const connection = await ensureConnection(userId);
  await logEvent({
    connectionId: connection.id,
    userId,
    action: "welcome_email_sent",
    target: "account",
    detail: "Enrollment welcome / payment confirmation email sent",
  });
}

export async function revokeTelegramAccess(
  userId: string,
  reason: "canceled" | "inactive" | "admin" | "period_end" = "canceled",
) {
  const connection = await prisma.telegramConnection.findUnique({
    where: { userId },
  });
  if (!connection) return;

  if (connection.telegramUserId) {
    await kickTelegramMember("group", connection.telegramUserId);
    await kickTelegramMember("channel", connection.telegramUserId);
  }

  if (connection.groupInviteLink) {
    await revokeChatInviteLink("group", connection.groupInviteLink);
  }
  if (connection.channelInviteLink) {
    await revokeChatInviteLink("channel", connection.channelInviteLink);
  }

  await prisma.telegramConnection.update({
    where: { id: connection.id },
    data: {
      groupAccessActive: false,
      channelAccessActive: false,
      groupInviteLink: null,
      channelInviteLink: null,
      invitationStatus: "access_revoked",
      accessRevokedAt: new Date(),
      connectionStatus:
        connection.connectionStatus === "connected" ? "revoked" : connection.connectionStatus,
    },
  });

  await prisma.membership.updateMany({
    where: { userId },
    data: { telegramInviteLink: null },
  });

  await logEvent({
    connectionId: connection.id,
    userId,
    action: "access_revoked",
    target: "both",
    detail: `Telegram access revoked (${reason})`,
    metadata: { reason },
  });

  if (connection.telegramUserId) {
    await sendTelegramDirectMessage(
      connection.telegramUserId,
      "Your Financial Revolution 3.0 Telegram access has ended with your membership. Rejoin from the member portal after renewing.",
    );
  }
}

export async function getMemberTelegramAccess(userId: string) {
  const membership = await prisma.membership.findUnique({ where: { userId } });
  if (!membership) return null;

  let connection = await ensureConnection(userId);
  const unlocked = await memberEligibleForTelegram(membership);

  // Replace shared fallbacks and legacy 14-day links the next time the member opens the portal.
  if (unlocked && !(await hasDurablePersonalInvites(userId, connection))) {
    await grantTelegramAccess(userId, "status_sync");
    connection = await ensureConnection(userId);
  }

  const recentEvents = await prisma.telegramAccessEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      action: true,
      target: true,
      detail: true,
      createdAt: true,
    },
  });

  return {
    unlocked,
    membershipStatus: membership.status,
    enrollmentPaid: membership.enrollmentPaid,
    telegramConfigured: isTelegramAccessConfigured(),
    botConfigured: isTelegramBotConfigured(),
    connectionStatus: connection.connectionStatus,
    invitationStatus: connection.invitationStatus,
    telegramUsername: connection.telegramUsername,
    telegramUserId: connection.telegramUserId,
    connectedAt: connection.connectedAt?.toISOString() ?? null,
    lastInvitedAt: connection.lastInvitedAt?.toISOString() ?? null,
    accessRevokedAt: connection.accessRevokedAt?.toISOString() ?? null,
    group: {
      name: getTelegramCommunityLabel("group"),
      inviteLink:
        unlocked &&
        connection.groupAccessActive &&
        isPersonalInviteLink("group", connection.groupInviteLink)
          ? connection.groupInviteLink
          : null,
      accessActive: connection.groupAccessActive,
    },
    channel: {
      name: getTelegramCommunityLabel("channel"),
      inviteLink:
        unlocked &&
        connection.channelAccessActive &&
        isPersonalInviteLink("channel", connection.channelInviteLink)
          ? connection.channelInviteLink
          : null,
      accessActive: connection.channelAccessActive,
    },
    canConnect: unlocked && isTelegramBotConfigured(),
    history: recentEvents.map((event) => ({
      action: event.action,
      target: event.target,
      detail: event.detail,
      at: event.createdAt.toISOString(),
    })),
  };
}

/** Used by membership notification layer after payment / restore / cancel. */
export async function syncTelegramForMembershipChange(params: {
  userId: string;
  previousStatus: string;
  nextStatus: string;
  reason: "checkout" | "restored" | "status_sync" | "past_due" | "canceled";
}) {
  const { userId, previousStatus, nextStatus, reason } = params;
  const { getPlatformSettings } = await import("./platform-settings.service.js");
  const settings = await getPlatformSettings();

  if (nextStatus === "active" && previousStatus !== "active") {
    await markTelegramEligible(userId);
    if (reason === "restored" || previousStatus === "past_due" || previousStatus === "canceled" || previousStatus === "inactive") {
      await grantTelegramAccess(userId, "restored");
    } else if (reason === "checkout") {
      await grantTelegramAccess(userId, "checkout");
    } else {
      await grantTelegramAccess(userId, "status_sync");
    }
    return;
  }

  if (
    settings.revokeTelegramOnCancel &&
    (nextStatus === "canceled" || nextStatus === "inactive") &&
    previousStatus !== nextStatus
  ) {
    await revokeTelegramAccess(
      userId,
      nextStatus === "inactive" ? "admin" : "period_end",
    );
  }

  if (
    settings.revokeTelegramOnPastDue &&
    nextStatus === "past_due" &&
    previousStatus !== "past_due"
  ) {
    await revokeTelegramAccess(userId, "canceled");
  }
}

export async function buildWelcomeTelegramEmailContext(userId: string) {
  const access = await getMemberTelegramAccess(userId);
  return {
    groupName: env.telegramGroupName,
    channelName: env.telegramChannelName,
    groupInviteLink: access?.group.inviteLink ?? null,
    channelInviteLink: access?.channel.inviteLink ?? null,
    awaitingConnection: access?.invitationStatus === "awaiting_connection",
    supportUrl: `${env.frontendUrl}/member/support`,
  };
}
