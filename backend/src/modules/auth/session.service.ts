import { env } from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import { createOpaqueToken, daysFromNow, hashToken } from "../../utils/crypto.js";
import { HttpError } from "../../utils/httpError.js";

export async function createSession(params: {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const refreshToken = createOpaqueToken(48);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = daysFromNow(env.jwtRefreshExpireDays);

  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      refreshTokenHash,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      expiresAt,
    },
  });

  return { session, refreshToken };
}

export async function rotateSession(refreshToken: string, meta?: {
  userAgent?: string;
  ipAddress?: string;
}) {
  const refreshTokenHash = hashToken(refreshToken);
  const existing = await prisma.session.findUnique({
    where: { refreshTokenHash },
    include: { user: true },
  });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  await prisma.session.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const next = await createSession({
    userId: existing.userId,
    userAgent: meta?.userAgent ?? existing.userAgent ?? undefined,
    ipAddress: meta?.ipAddress ?? existing.ipAddress ?? undefined,
  });

  return {
    user: existing.user,
    refreshToken: next.refreshToken,
    session: next.session,
  };
}

export async function revokeSessionByRefreshToken(refreshToken: string) {
  const refreshTokenHash = hashToken(refreshToken);
  const existing = await prisma.session.findUnique({
    where: { refreshTokenHash },
  });

  if (!existing) return;

  if (!existing.revokedAt) {
    await prisma.session.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
  }
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
