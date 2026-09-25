import { env } from "../config/index.js";

type TelegramApiResponse<T> = {
  ok: boolean;
  description?: string;
  result?: T;
};

type ChatInviteLink = {
  invite_link: string;
};

export type TelegramChatTarget = "group" | "channel";

async function telegramApi<T>(
  method: string,
  body: Record<string, unknown> = {},
): Promise<T | null> {
  if (!env.telegramBotToken) return null;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.telegramBotToken}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const payload = (await response.json()) as TelegramApiResponse<T>;
    if (!payload.ok) {
      console.error("[telegram]", method, payload.description ?? "request failed");
      return null;
    }
    return payload.result ?? null;
  } catch (error) {
    console.error("[telegram]", method, error);
    return null;
  }
}

export function isTelegramBotConfigured() {
  return Boolean(env.telegramBotToken && env.telegramBotUsername);
}

export function isTelegramAccessConfigured() {
  return Boolean(
    env.telegramGroupInviteLink &&
      env.telegramChannelInviteLink &&
      (isTelegramBotConfigured() ||
        env.telegramGroupChatId ||
        env.telegramChannelChatId),
  );
}

export function getTelegramChatId(target: TelegramChatTarget) {
  return target === "group" ? env.telegramGroupChatId : env.telegramChannelChatId;
}

export function getStaticInviteLink(target: TelegramChatTarget) {
  return target === "group"
    ? env.telegramGroupInviteLink
    : env.telegramChannelInviteLink;
}

/** True when the link is a member-specific invite, not the shared env fallback. */
export function isPersonalInviteLink(
  target: TelegramChatTarget,
  inviteLink?: string | null,
) {
  return Boolean(inviteLink && inviteLink !== getStaticInviteLink(target));
}

export function getTelegramCommunityLabel(target: TelegramChatTarget) {
  return target === "group" ? env.telegramGroupName : env.telegramChannelName;
}

export async function createChatInviteLink(params: {
  target: TelegramChatTarget;
  label: string;
  memberLimit?: number;
  expireDays?: number;
}) {
  const chatId = getTelegramChatId(params.target);
  if (!chatId || !env.telegramBotToken) {
    return {
      inviteLink: getStaticInviteLink(params.target),
      source: "static" as const,
    };
  }

  const body: Record<string, unknown> = {
    chat_id: chatId,
    name: params.label.slice(0, 32),
    // One join per paid member. Omit expire_date so the link stays valid until used.
    member_limit: params.memberLimit ?? 1,
  };
  if (params.expireDays && params.expireDays > 0) {
    body.expire_date =
      Math.floor(Date.now() / 1000) + 60 * 60 * 24 * params.expireDays;
  }

  const result = await telegramApi<ChatInviteLink>("createChatInviteLink", body);

  if (result?.invite_link) {
    return { inviteLink: result.invite_link, source: "bot" as const };
  }

  return {
    inviteLink: getStaticInviteLink(params.target),
    source: "static" as const,
  };
}

export async function revokeChatInviteLink(
  target: TelegramChatTarget,
  inviteLink: string,
) {
  const chatId = getTelegramChatId(target);
  const staticLink = getStaticInviteLink(target);
  if (!chatId || !env.telegramBotToken || !inviteLink || inviteLink === staticLink) {
    return false;
  }

  const result = await telegramApi<ChatInviteLink>("revokeChatInviteLink", {
    chat_id: chatId,
    invite_link: inviteLink,
  });
  return Boolean(result?.invite_link);
}

/** Remove a member from a chat. Requires bot admin with ban permission. */
export async function kickTelegramMember(
  target: TelegramChatTarget,
  telegramUserId: string,
) {
  const chatId = getTelegramChatId(target);
  if (!chatId || !env.telegramBotToken) return false;

  const banned = await telegramApi<boolean>("banChatMember", {
    chat_id: chatId,
    user_id: Number(telegramUserId),
    revoke_messages: false,
  });

  // Immediately unban so they can rejoin later via invite (kick-only).
  if (banned) {
    await telegramApi<boolean>("unbanChatMember", {
      chat_id: chatId,
      user_id: Number(telegramUserId),
      only_if_banned: true,
    });
  }

  return Boolean(banned);
}

/** Clear any ban so a returning member can join again. */
export async function unbanTelegramMember(
  target: TelegramChatTarget,
  telegramUserId: string,
) {
  const chatId = getTelegramChatId(target);
  if (!chatId || !env.telegramBotToken) return false;

  return Boolean(
    await telegramApi<boolean>("unbanChatMember", {
      chat_id: chatId,
      user_id: Number(telegramUserId),
      only_if_banned: true,
    }),
  );
}

export async function sendTelegramDirectMessage(
  telegramUserId: string,
  text: string,
) {
  return telegramApi<{ message_id: number }>("sendMessage", {
    chat_id: Number(telegramUserId),
    text,
    disable_web_page_preview: true,
  });
}

export { telegramApi };
