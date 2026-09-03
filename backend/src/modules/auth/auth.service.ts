import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/index.js";
import {
  createUserWithMembership,
  findUserByEmail,
  findUserById,
  updateUserById,
} from "../../data/store.js";
import { getPlatformSettings } from "../../services/platform-settings.service.js";
import type { AuthPayload } from "../../types/auth.js";
import type { UserRole } from "../../types/domain.js";
import { HttpError } from "../../utils/httpError.js";
import {
  sendEmailVerification,
  sendPasswordReset,
  resetPasswordWithCode,
  verifyEmailCode,
} from "./email-token.service.js";
import {
  createSession,
  revokeAllUserSessions,
  revokeSessionByRefreshToken,
  rotateSession,
} from "./session.service.js";

function toPublicUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isEmailVerified: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
}

export const signAccessToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpire as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string): AuthPayload =>
  jwt.verify(token, env.jwtSecret) as AuthPayload;

/** @deprecated use verifyAccessToken */
export const verifyToken = verifyAccessToken;

export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  role: UserRole = "member",
) => {
  const settings = await getPlatformSettings();
  if (!settings.newSignupsEnabled && role === "member") {
    throw new HttpError(403, "New member signups are temporarily disabled.");
  }
  if (settings.maintenanceMode && role === "member") {
    throw new HttpError(503, "The platform is in maintenance mode. Please try again later.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) throw new HttpError(409, "Email already exists");

  const user = await createUserWithMembership({
    email: normalizedEmail,
    fullName,
    passwordHash: await bcrypt.hash(password, 10),
    role,
  });

  await sendEmailVerification(user);

  return {
    message: "Account created. Check your email for a verification code.",
    user: toPublicUser(user),
  };
};

export const loginUser = async (
  email: string,
  password: string,
  meta?: { userAgent?: string; ipAddress?: string },
) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) throw new HttpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password");

  const settings = await getPlatformSettings();
  if (settings.maintenanceMode && user.role === "member") {
    throw new HttpError(503, "The platform is in maintenance mode. Please try again later.");
  }

  if (settings.requireEmailVerification && !user.isEmailVerified) {
    throw new HttpError(403, "Please verify your email before signing in.");
  }

  const { refreshToken } = await createSession({
    userId: user.id,
    userAgent: meta?.userAgent,
    ipAddress: meta?.ipAddress,
  });

  return {
    accessToken: signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    }),
    refreshToken,
    user: toPublicUser(user),
  };
};

export const refreshAuthSession = async (
  refreshToken: string,
  meta?: { userAgent?: string; ipAddress?: string },
) => {
  const rotated = await rotateSession(refreshToken, meta);

  return {
    accessToken: signAccessToken({
      sub: rotated.user.id,
      email: rotated.user.email,
      role: rotated.user.role,
    }),
    refreshToken: rotated.refreshToken,
    user: toPublicUser(rotated.user),
  };
};

export const logoutUser = async (refreshToken?: string) => {
  if (refreshToken) {
    await revokeSessionByRefreshToken(refreshToken);
  }
  return { message: "Signed out successfully." };
};

export const requestEmailVerification = async (email: string) => {
  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user) throw new HttpError(404, "Account not found");
  if (user.isEmailVerified) {
    return { message: "Email is already verified." };
  }
  await sendEmailVerification(user);
  return { message: "Verification code resent." };
};

export const verifyUserEmail = async (email: string, code: string) =>
  verifyEmailCode(email, code);

export const requestPasswordReset = async (email: string) =>
  sendPasswordReset(email);

export const resetUserPassword = async (params: {
  email: string;
  code: string;
  newPassword: string;
}) => resetPasswordWithCode(params);

export const changeUserPassword = async (params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) => {
  if (params.newPassword.length < 8) {
    throw new HttpError(400, "New password must be at least 8 characters");
  }

  const user = await findUserById(params.userId);
  if (!user) throw new HttpError(404, "Account not found");

  const valid = await bcrypt.compare(params.currentPassword, user.passwordHash);
  if (!valid) throw new HttpError(400, "Current password is incorrect");

  const samePassword = await bcrypt.compare(params.newPassword, user.passwordHash);
  if (samePassword) {
    throw new HttpError(400, "New password must be different from current password");
  }

  await updateUserById(user.id, {
    passwordHash: await bcrypt.hash(params.newPassword, 10),
  });
  await revokeAllUserSessions(user.id);

  return { message: "Password updated successfully. Please sign in again." };
};
