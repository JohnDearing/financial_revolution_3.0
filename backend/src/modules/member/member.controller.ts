import { NextFunction, Response } from "express";
import type { AuthRequest } from "../../types/auth.js";
import { sendOk } from "../../utils/apiResponse.js";
import { HttpError } from "../../utils/httpError.js";
import {
  cancelMemberSubscription,
  confirmCheckoutSessionForMember,
  createBillingPortalSession,
  createCheckoutSessionForMember,
  getCurrentMemberProfile,
  getMemberBillingSummary,
  getMemberPaymentHistory,
  updateCurrentMemberProfile,
} from "./member.service.js";
import {
  createTelegramConnectSession,
  getMemberTelegramAccess,
} from "../../services/telegram-access.service.js";
import {
  getMemberDashboard,
  getMemberLearningHub,
  markLearningContentComplete,
} from "./member-dashboard.service.js";
import { searchMemberPortal } from "./member-search.service.js";

/**
 * @openapi
 * /api/members/me:
 *   get:
 *     tags: [Members]
 *     summary: Get current member profile and membership
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member profile
 *       401:
 *         description: Unauthorized
 */
export async function currentMemberController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getCurrentMemberProfile(req.user!.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/me:
 *   patch:
 *     tags: [Members]
 *     summary: Update current profile details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Profile updated
 */
export async function updateMemberProfileController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fullName, email } = req.body as {
      fullName?: string;
      email?: string;
    };

    if (!fullName && !email) {
      res.status(400).json({
        success: false,
        message: "Provide fullName and/or email to update",
      });
      return;
    }

    const data = await updateCurrentMemberProfile(req.user!.sub, {
      fullName,
      email,
    });
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/billing:
 *   get:
 *     tags: [Members]
 *     summary: Get Stripe-backed billing summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing summary
 */
export async function memberBillingController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getMemberBillingSummary(req.user!.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/billing/history:
 *   get:
 *     tags: [Members]
 *     summary: List Stripe invoices for the current member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated payment history
 */
export async function memberBillingHistoryController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page ?? 1);
    const data = await getMemberPaymentHistory(req.user!.sub, page);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/checkout-session:
 *   post:
 *     tags: [Members]
 *     summary: Create Stripe checkout session for membership
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Checkout session created
 *       401:
 *         description: Unauthorized
 */
export async function memberCheckoutController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await createCheckoutSessionForMember(req.user!.sub);
    sendOk(res, data, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/confirm-checkout:
 *   post:
 *     tags: [Members]
 *     summary: Confirm Stripe checkout and send welcome / Telegram invites
 *     security:
 *       - bearerAuth: []
 */
export async function memberConfirmCheckoutController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const sessionId =
      typeof req.body?.sessionId === "string"
        ? req.body.sessionId.trim()
        : typeof req.body?.session_id === "string"
          ? req.body.session_id.trim()
          : "";
    const data = await confirmCheckoutSessionForMember(req.user!.sub, sessionId);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/billing-portal:
 *   post:
 *     tags: [Members]
 *     summary: Create Stripe Customer Portal session for card updates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portal session created
 */
export async function memberBillingPortalController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await createBillingPortalSession(req.user!.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/cancel-subscription:
 *   post:
 *     tags: [Members]
 *     summary: Cancel membership subscription at period end
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cancellation scheduled
 */
export async function memberCancelSubscriptionController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await cancelMemberSubscription(req.user!.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/dashboard:
 *   get:
 *     tags: [Members]
 *     summary: Member dashboard summary
 *     security:
 *       - bearerAuth: []
 */
export async function memberDashboardController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getMemberDashboard(req.user!.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/learning:
 *   get:
 *     tags: [Members]
 *     summary: Learning hub curriculum and progress
 *     security:
 *       - bearerAuth: []
 */
export async function memberLearningController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getMemberLearningHub(req.user!.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/learning/complete:
 *   post:
 *     tags: [Members]
 *     summary: Mark a published content item as completed
 *     security:
 *       - bearerAuth: []
 */
export async function memberLearningCompleteController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const contentId =
      typeof req.body?.contentId === "string" ? req.body.contentId.trim() : "";
    if (!contentId) {
      throw new HttpError(400, "contentId is required.");
    }
    const data = await markLearningContentComplete(req.user!.sub, contentId);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/telegram:
 *   get:
 *     tags: [Members]
 *     summary: Telegram connection and invite status
 *     security:
 *       - bearerAuth: []
 */
export async function memberTelegramStatusController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getMemberTelegramAccess(req.user!.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/telegram/connect:
 *   post:
 *     tags: [Members]
 *     summary: Start secure Connect Telegram session
 *     security:
 *       - bearerAuth: []
 */
export async function memberTelegramConnectController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await createTelegramConnectSession(req.user!.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/members/search:
 *   get:
 *     tags: [Members]
 *     summary: Search member portal pages, content, and classes
 *     security:
 *       - bearerAuth: []
 */
export async function memberSearchController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const data = await searchMemberPortal(req.user!.sub, q);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}
