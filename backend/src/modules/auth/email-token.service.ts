import type { EmailTokenType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import {
  createOpaqueToken,
  createSixDigitCode,
  hashToken,
  minutesFromNow,
} from "../../utils/crypto.js";
import { HttpError } from "../../utils/httpError.js";
import {
  passwordResetEmailTemplate,
  verificationEmailTemplate,
} from "../../emails/templates.js";
import { sendEmail } from "../../utils/smtp.js";

const TOKEN_TTL_MINUTES: Record<EmailTokenType, number> = {
  email_verification: 30,
  password_reset: 30,
};

async function issueToken(params: {
  userId: string;
  type: EmailTokenType;
  useSixDigitCode?: boolean;
}) {
  await prisma.emailVerificationToken.updateMany({
    where: {
      userId: params.userId,
      type: params.type,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  const rawToken = params.useSixDigitCode
    ? createSixDigitCode()
    : createOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = minutesFromNow(TOKEN_TTL_MINUTES[params.type]);

  await prisma.emailVerificationToken.create({
    data: {
      userId: params.userId,
      type: params.type,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export async function sendEmailVerification(user: {
  id: string;
  email: string;
  fullName: string;
}) {
  const { rawToken, expiresAt } = await issueToken({
    userId: user.id,
    type: "email_verification",
    useSixDigitCode: true,
  });

  const template = verificationEmailTemplate({
    fullName: user.fullName,
    code: rawToken,
    expiresAt,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });

  return { expiresAt };
}

export async function verifyEmailCode(email: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) throw new HttpError(404, "Account not found");

  const tokenHash = hashToken(code.trim());
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      type: "email_verification",
      tokenHash,
      usedAt: null,
    },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired verification code");
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  return { message: "Email verified successfully." };
}

export async function sendPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Avoid account enumeration.
  if (!user) {
    return {
      message: "If that email exists, reset instructions have been sent.",
    };
  }

  const { rawToken, expiresAt } = await issueToken({
    userId: user.id,
    type: "password_reset",
    useSixDigitCode: true,
  });

  const template = passwordResetEmailTemplate({
    fullName: user.fullName,
    code: rawToken,
    expiresAt,
  });

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });

  return {
    message: "If that email exists, reset instructions have been sent.",
  };
}

export async function resetPasswordWithCode(params: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email: params.email.trim().toLowerCase() },
  });
  if (!user) throw new HttpError(400, "Invalid reset request");

  const tokenHash = hashToken(params.code.trim());
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      type: "password_reset",
      tokenHash,
      usedAt: null,
    },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired reset code");
  }

  const passwordHash = await bcrypt.hash(params.newPassword, 10);

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { message: "Password reset successfully." };
}
