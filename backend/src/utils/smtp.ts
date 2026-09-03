import nodemailer from "nodemailer";
import { env } from "../config/index.js";

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  // Gmail app passwords are often copied with spaces — strip them.
  const pass = env.smtpPass.replace(/\s+/g, "");

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass,
    },
  });
}

export function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transporter = getTransporter();
  const text =
    params.text ??
    params.html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (!transporter) {
    console.info("[smtp:mock]", {
      to: params.to,
      subject: params.subject,
      delivered: false,
      reason: "SMTP not configured — set SMTP_USER and SMTP_PASS",
    });
    return { delivered: false as const, reason: "SMTP not configured" };
  }

  try {
    // Prefer authenticated mailbox as From — Gmail rejects mismatched aliases.
    const from =
      env.smtpFrom && env.smtpFrom.includes(env.smtpUser)
        ? env.smtpFrom
        : `Financial Revolution 3.0 <${env.smtpUser}>`;

    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text,
    });

    console.info("[smtp:sent]", {
      to: params.to,
      subject: params.subject,
      messageId: info.messageId,
    });

    return { delivered: true as const, messageId: info.messageId };
  } catch (error) {
    console.error("[smtp:error]", {
      to: params.to,
      subject: params.subject,
      error,
    });
    return { delivered: false as const, reason: "SMTP send failed" };
  }
}
