import { NextFunction, Request, Response } from "express";
import { sendOk } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../types/auth.js";
import {
  changeUserPassword,
  loginUser,
  logoutUser,
  refreshAuthSession,
  registerUser,
  requestEmailVerification,
  requestPasswordReset,
  resetUserPassword,
  verifyUserEmail,
} from "./auth.service.js";

function requestMeta(req: Request) {
  return {
    userAgent: req.get("user-agent") ?? undefined,
    ipAddress: req.ip,
  };
}

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new member account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               fullName: { type: string }
 *               role: { type: string, enum: [member, admin] }
 *     responses:
 *       201:
 *         description: Account created and verification email sent
 */
export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName, role } = req.body as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: "member" | "admin";
    };

    if (!email || !password || !fullName) {
      res.status(400).json({
        success: false,
        message: "email, password, and fullName are required",
      });
      return;
    }

    const data = await registerUser(email, password, fullName, role);
    sendOk(res, data, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in and receive access + refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Authenticated session created
 */
export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ success: false, message: "email and password are required" });
      return;
    }

    const data = await loginUser(email, password, requestMeta(req));
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and issue a new access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Tokens refreshed
 */
export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(400).json({ success: false, message: "refreshToken is required" });
      return;
    }

    const data = await refreshAuthSession(refreshToken, requestMeta(req));
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a refresh-token session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Session revoked
 */
export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    const data = await logoutUser(refreshToken);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with a 6-digit code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string, minLength: 6, maxLength: 6 }
 *     responses:
 *       200:
 *         description: Email verified
 */
export async function verifyEmailController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body as { email?: string; code?: string };
    if (!email || !code) {
      res.status(400).json({ success: false, message: "email and code are required" });
      return;
    }

    const data = await verifyUserEmail(email, code);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Verification email resent
 */
export async function resendVerificationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ success: false, message: "email is required" });
      return;
    }

    const data = await requestEmailVerification(email);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset instructions sent if account exists
 */
export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ success: false, message: "email is required" });
      return;
    }

    const data = await requestPasswordReset(email);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using email + code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string, minLength: 6, maxLength: 6 }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated and sessions revoked
 */
export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, code, newPassword } = req.body as {
      email?: string;
      code?: string;
      newPassword?: string;
    };

    if (!email || !code || !newPassword) {
      res.status(400).json({
        success: false,
        message: "email, code, and newPassword are required",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "newPassword must be at least 8 characters",
      });
      return;
    }

    const data = await resetUserPassword({ email, code, newPassword });
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password for authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 */
export async function changePasswordController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "currentPassword and newPassword are required",
      });
      return;
    }

    const data = await changeUserPassword({
      userId: req.user!.sub,
      currentPassword,
      newPassword,
    });
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}
