import { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../../types/auth.js";
import type { MembershipStatus } from "../../types/domain.js";
import { sendOk } from "../../utils/apiResponse.js";
import {
  createAdminContent,
  createCloudinaryUploadSignature,
  deleteAdminContent,
  getAdminBillingOps,
  getAdminOverview,
  getAdminSettings,
  listAdminContent,
  listMembersForAdminDetailed,
  saveAdminSettings,
  updateMembershipStatusByAdmin,
  uploadContentVideo,
} from "./admin.service.js";

/**
 * @openapi
 * /api/admin/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Admin dashboard overview metrics
 *     security:
 *       - bearerAuth: []
 */
export async function adminOverviewController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getAdminOverview();
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/members:
 *   get:
 *     tags: [Admin]
 *     summary: List memberships and members (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 */
export async function adminMembersController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);
    const data = await listMembersForAdminDetailed(page, pageSize);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/members/{membershipId}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a membership status
 *     security:
 *       - bearerAuth: []
 */
export async function adminMembershipStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { membershipId } = req.params;
    const { status } = req.body as { status?: MembershipStatus };
    if (!status) {
      res.status(400).json({ success: false, message: "status is required" });
      return;
    }
    const data = await updateMembershipStatusByAdmin(membershipId, status);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/billing:
 *   get:
 *     tags: [Admin]
 *     summary: Billing operations snapshot
 *     security:
 *       - bearerAuth: []
 */
export async function adminBillingController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getAdminBillingOps();
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/content:
 *   get:
 *     tags: [Admin]
 *     summary: Content operations queue
 *     security:
 *       - bearerAuth: []
 */
export async function adminContentController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await listAdminContent();
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/content:
 *   post:
 *     tags: [Admin]
 *     summary: Upload video content to Cloudinary and create a content item
 *     security:
 *       - bearerAuth: []
 */
export async function adminCreateContentController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = req.body as {
      title?: string;
      type?: string;
      track?: string;
      description?: string;
      status?: "draft" | "scheduled" | "published";
      scheduledFor?: string;
      videoUrl?: string;
      videoPublicId?: string;
      thumbnailUrl?: string;
      durationSec?: string | number;
    };

    if (!body.title?.trim()) {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const file = req.file;
    let videoMeta: {
      videoUrl?: string | null;
      videoPublicId?: string | null;
      thumbnailUrl?: string | null;
      durationSec?: number | null;
    } = {
      videoUrl: body.videoUrl ?? null,
      videoPublicId: body.videoPublicId ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      durationSec:
        body.durationSec !== undefined && body.durationSec !== ""
          ? Number(body.durationSec)
          : null,
    };

    if (file) {
      videoMeta = await uploadContentVideo(file);
    }

    if (!videoMeta.videoUrl) {
      res.status(400).json({
        success: false,
        message: "A Cloudinary video upload is required",
      });
      return;
    }

    const data = await createAdminContent({
      title: body.title,
      type: body.type ?? "recording",
      track: body.track,
      description: body.description,
      status: body.status ?? "draft",
      scheduledFor: body.scheduledFor,
      ...videoMeta,
    });

    sendOk(res, data, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/content/sign-upload:
 *   post:
 *     tags: [Admin]
 *     summary: Create a signed Cloudinary upload payload
 *     security:
 *       - bearerAuth: []
 */
export async function adminSignContentUploadController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = createCloudinaryUploadSignature();
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/content/{contentId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a content item and its Cloudinary video
 *     security:
 *       - bearerAuth: []
 */
export async function adminDeleteContentController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await deleteAdminContent(req.params.contentId);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/search:
 *   get:
 *     tags: [Admin]
 *     summary: Search admin pages, members, and content
 *     security:
 *       - bearerAuth: []
 */
export async function adminSearchController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const { searchAdminPortal } = await import("./admin-search.service.js");
    const data = await searchAdminPortal(q);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform settings and integration health
 *     security:
 *       - bearerAuth: []
 */
export async function adminGetSettingsController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getAdminSettings();
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /api/admin/settings:
 *   put:
 *     tags: [Admin]
 *     summary: Update platform settings
 *     security:
 *       - bearerAuth: []
 */
export async function adminUpdateSettingsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await saveAdminSettings(req.body ?? {}, req.user?.sub);
    sendOk(res, data);
  } catch (error) {
    next(error);
  }
}
