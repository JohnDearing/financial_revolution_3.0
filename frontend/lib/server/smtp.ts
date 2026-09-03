import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendAuthEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();

  if (!transporter) {
    return { delivered: false, reason: "SMTP not configured" as const };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  return { delivered: true as const };
}
