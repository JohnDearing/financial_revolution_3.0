import { NextFunction, Request, Response, Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";
import { contentVideoUpload } from "../../middleware/upload.middleware.js";
import {
  adminBillingController,
  adminContentController,
  adminCreateContentController,
  adminDeleteContentController,
  adminGetSettingsController,
  adminMembersController,
  adminMembershipStatusController,
  adminOverviewController,
  adminSearchController,
  adminSignContentUploadController,
  adminUpdateSettingsController,
} from "./admin.controller.js";

function optionalContentVideoUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("multipart/form-data")) {
    contentVideoUpload.single("video")(req, res, next);
    return;
  }
  next();
}

export const adminRouter = Router();

adminRouter.get("/overview", requireAuth, requireRole("admin"), adminOverviewController);
adminRouter.get("/search", requireAuth, requireRole("admin"), adminSearchController);
adminRouter.get("/members", requireAuth, requireRole("admin"), adminMembersController);
adminRouter.patch(
  "/members/:membershipId/status",
  requireAuth,
  requireRole("admin"),
  adminMembershipStatusController,
);
adminRouter.get("/billing", requireAuth, requireRole("admin"), adminBillingController);
adminRouter.get("/content", requireAuth, requireRole("admin"), adminContentController);
adminRouter.post(
  "/content/sign-upload",
  requireAuth,
  requireRole("admin"),
  adminSignContentUploadController,
);
adminRouter.post(
  "/content",
  requireAuth,
  requireRole("admin"),
  optionalContentVideoUpload,
  adminCreateContentController,
);
adminRouter.delete(
  "/content/:contentId",
  requireAuth,
  requireRole("admin"),
  adminDeleteContentController,
);
adminRouter.get("/settings", requireAuth, requireRole("admin"), adminGetSettingsController);
adminRouter.put("/settings", requireAuth, requireRole("admin"), adminUpdateSettingsController);
