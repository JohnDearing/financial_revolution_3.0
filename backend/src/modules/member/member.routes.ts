import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  currentMemberController,
  memberBillingController,
  memberBillingHistoryController,
  memberBillingPortalController,
  memberCancelSubscriptionController,
  memberCheckoutController,
  memberConfirmCheckoutController,
  memberDashboardController,
  memberLearningCompleteController,
  memberLearningController,
  memberSearchController,
  memberTelegramConnectController,
  memberTelegramStatusController,
  updateMemberProfileController,
} from "./member.controller.js";

export const memberRouter = Router();

memberRouter.get("/me", requireAuth, currentMemberController);
memberRouter.patch("/me", requireAuth, updateMemberProfileController);
memberRouter.get("/dashboard", requireAuth, memberDashboardController);
memberRouter.get("/search", requireAuth, memberSearchController);
memberRouter.get("/learning", requireAuth, memberLearningController);
memberRouter.post(
  "/learning/complete",
  requireAuth,
  memberLearningCompleteController,
);
memberRouter.get("/telegram", requireAuth, memberTelegramStatusController);
memberRouter.post(
  "/telegram/connect",
  requireAuth,
  memberTelegramConnectController,
);
memberRouter.get("/billing", requireAuth, memberBillingController);
memberRouter.get("/billing/history", requireAuth, memberBillingHistoryController);
memberRouter.post("/checkout-session", requireAuth, memberCheckoutController);
memberRouter.post(
  "/confirm-checkout",
  requireAuth,
  memberConfirmCheckoutController,
);
memberRouter.post("/billing-portal", requireAuth, memberBillingPortalController);
memberRouter.post(
  "/cancel-subscription",
  requireAuth,
  memberCancelSubscriptionController,
);
