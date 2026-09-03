import type { Request, Response } from "express";
import { env } from "../../config/index.js";
import { completeTelegramConnectFromBot } from "../../services/telegram-access.service.js";
import { sendTelegramDirectMessage } from "../../services/telegram.service.js";

type TelegramUpdate = {
  message?: {
    text?: string;
    from?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

/**
 * Telegram bot webhook.
 * Members open: https://t.me/<bot>?start=fr3_<token>
 */
export async function telegramWebhookController(req: Request, res: Response) {
  try {
    if (env.telegramWebhookSecret) {
      const header = req.header("x-telegram-bot-api-secret-token");
      if (header !== env.telegramWebhookSecret) {
        res.status(401).json({ ok: false });
        return;
      }
    }

    // Acknowledge immediately so Telegram does not retry.
    res.json({ ok: true });

    const update = req.body as TelegramUpdate;
    const message = update.message;
    const text = message?.text?.trim() ?? "";
    const from = message?.from;
    if (!from || !text.startsWith("/start")) return;

    const payload = text.replace(/^\/start\s*/, "").trim();
    if (!payload.startsWith("fr3_")) {
      await sendTelegramDirectMessage(
        String(from.id),
        "Welcome to Financial Revolution 3.0.\n\nTo connect your membership, open the member portal → Support → Connect Telegram.",
      );
      return;
    }

    const rawToken = payload.slice(4);
    const result = await completeTelegramConnectFromBot({
      rawToken,
      telegramUserId: String(from.id),
      telegramUsername: from.username ?? null,
      telegramFirstName: from.first_name ?? null,
      telegramLastName: from.last_name ?? null,
    });

    await sendTelegramDirectMessage(String(from.id), result.message);
  } catch (error) {
    console.error("[telegram:webhook]", error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false });
    }
  }
}
