import type { MembershipStatus } from "../../types/domain.js";
import { cloudinary, env, isCloudinaryConfigured, stripe } from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import {
  getAdminSettingsPayload,
  getPlatformSettings,
  updatePlatformSettings,
  type PlatformSettingsUpdate,
} from "../../services/platform-settings.service.js";
import { HttpError } from "../../utils/httpError.js";
import {
  findMembershipByIdOrThrow,
  listAllMemberships,
  setMembershipStatus,
} from "../member/member.service.js";

export const getAdminSettings = getAdminSettingsPayload;

export const saveAdminSettings = async (
  input: PlatformSettingsUpdate,
  updatedByUserId?: string,
) => {
  await updatePlatformSettings(input, updatedByUserId);
  return getAdminSettingsPayload();
};

export const updateMembershipStatusByAdmin = async (
  membershipId: string,
  status: MembershipStatus,
) => {
  const membership = await findMembershipByIdOrThrow(membershipId);
  await setMembershipStatus(membership, status);
  return membership;
};

export const getAdminOverview = async () => {
  const [users, memberships, content] = await Promise.all([
    prisma.user.findMany({
      where: { role: "member" },
      select: { id: true, isEmailVerified: true },
    }),
    prisma.membership.findMany(),
    prisma.contentItem.findMany(),
  ]);

  const activeMembers = memberships.filter((item) => item.status === "active").length;
  const pendingVerifications = users.filter((user) => !user.isEmailVerified).length;
  const pendingEnrollments = memberships.filter(
    (item) => !item.enrollmentPaid || item.status === "pending",
  ).length;
  const pastDueCount = memberships.filter((item) => item.status === "past_due").length;
  const canceledCount = memberships.filter((item) => item.status === "canceled").length;
  const enrollmentRevenue = memberships.filter((item) => item.enrollmentPaid).length * 150;
  const mrrEstimate = activeMembers * 99;
  const draftContent = content.filter((item) => item.status === "draft").length;
  const scheduledContent = content.filter((item) => item.status === "scheduled").length;

  const priorities = [
    pendingVerifications > 0
      ? `Review ${pendingVerifications} pending email verification${pendingVerifications === 1 ? "" : "s"}`
      : "No pending email verifications",
    pendingEnrollments > 0
      ? `Follow up on ${pendingEnrollments} incomplete enrollment${pendingEnrollments === 1 ? "" : "s"}`
      : "All tracked enrollments are complete",
    pastDueCount > 0
      ? `Audit ${pastDueCount} past-due membership${pastDueCount === 1 ? "" : "s"}`
      : "No past-due memberships right now",
    draftContent > 0
      ? `Approve ${draftContent} draft content item${draftContent === 1 ? "" : "s"}`
      : "Content draft queue is clear",
  ];

  return {
    activeMembers,
    pendingVerifications,
    pendingEnrollments,
    pastDueCount,
    canceledCount,
    mrrEstimate,
    enrollmentRevenue,
    draftContent,
    scheduledContent,
    totalMembers: users.length,
    automationHealth: {
      label: stripe ? "Healthy" : "Degraded",
      percent: stripe ? "99.2%" : "72.0%",
      stripeConfigured: Boolean(stripe && env.stripeSecretKey),
      api: "ok" as const,
    },
    priorities,
    emailFlow: {
      verificationEnabled: true,
      passwordResetEnabled: true,
      welcomeEnabled: Boolean(env.smtpUser && env.smtpPass),
      smtpConfigured: Boolean(env.smtpHost && env.smtpUser && env.smtpPass),
      telegramConfigured: Boolean(
        env.telegramGroupInviteLink && env.telegramChannelInviteLink,
      ),
      telegramBotConfigured: Boolean(
        env.telegramBotToken && env.telegramBotUsername,
      ),
      telegramGroup: env.telegramGroupName,
      telegramChannel: env.telegramChannelName,
    },
  };
};

export const getAdminBillingOps = async () => {
  const memberships = await listAllMemberships();
  const pastDue = memberships.filter((item) => item.status === "past_due");
  const canceled = memberships.filter((item) => item.status === "canceled");
  const pending = memberships.filter(
    (item) => !item.enrollmentPaid || item.status === "pending",
  );
  const active = memberships.filter((item) => item.status === "active");

  return {
    summary: {
      activeSubscriptions: active.length,
      pastDueCount: pastDue.length,
      canceledCount: canceled.length,
      pendingEnrollments: pending.length,
      mrrEstimate: active.length * 99,
      enrollmentRevenue: memberships.filter((item) => item.enrollmentPaid).length * 150,
    },
    pastDueMembers: pastDue.map((item) => ({
      membershipId: item.membershipId,
      status: item.status,
      fullName: item.user?.fullName ?? "Unknown",
      email: item.user?.email ?? "",
    })),
    pendingEnrollments: pending.map((item) => ({
      membershipId: item.membershipId,
      status: item.status,
      enrollmentPaid: item.enrollmentPaid,
      fullName: item.user?.fullName ?? "Unknown",
      email: item.user?.email ?? "",
    })),
  };
};

export const listAdminContent = async () => {
  const items = await prisma.contentItem.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return {
    summary: {
      draft: items.filter((item) => item.status === "draft").length,
      scheduled: items.filter((item) => item.status === "scheduled").length,
      published: items.filter((item) => item.status === "published").length,
    },
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      track: item.track,
      description: item.description,
      status: item.status,
      videoUrl: item.videoUrl,
      videoPublicId: item.videoPublicId,
      thumbnailUrl: item.thumbnailUrl,
      durationSec: item.durationSec,
      scheduledFor: item.scheduledFor?.toISOString() ?? null,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
};

type CreateContentInput = {
  title: string;
  type: string;
  track?: string;
  description?: string;
  status?: "draft" | "scheduled" | "published";
  scheduledFor?: string | null;
  videoUrl?: string | null;
  videoPublicId?: string | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
};

export const createCloudinaryUploadSignature = () => {
  if (!isCloudinaryConfigured) {
    throw new HttpError(503, "Cloudinary is not configured");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "financial-revolution/content";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.cloudinaryApiSecret,
  );

  return {
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    timestamp,
    folder,
    signature,
  };
};

export const createAdminContent = async (input: CreateContentInput) => {
  const title = input.title.trim();
  if (title.length < 2) {
    throw new HttpError(400, "Title must be at least 2 characters");
  }

  const status = input.status ?? "draft";
  const item = await prisma.contentItem.create({
    data: {
      title,
      type: input.type.trim() || "recording",
      track: input.track?.trim() || null,
      description: input.description?.trim() || null,
      status,
      videoUrl: input.videoUrl ?? null,
      videoPublicId: input.videoPublicId ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      durationSec: input.durationSec ?? null,
      scheduledFor:
        status === "scheduled" && input.scheduledFor
          ? new Date(input.scheduledFor)
          : null,
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  return {
    id: item.id,
    title: item.title,
    type: item.type,
    track: item.track,
    description: item.description,
    status: item.status,
    videoUrl: item.videoUrl,
    videoPublicId: item.videoPublicId,
    thumbnailUrl: item.thumbnailUrl,
    durationSec: item.durationSec,
    scheduledFor: item.scheduledFor?.toISOString() ?? null,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
  };
};

export const uploadContentVideo = async (file: Express.Multer.File) => {
  if (!isCloudinaryConfigured) {
    throw new HttpError(503, "Cloudinary is not configured");
  }
  if (!file?.buffer?.length) {
    throw new HttpError(400, "Video file is required");
  }

  const uploaded = await new Promise<{
    secure_url: string;
    public_id: string;
    duration?: number;
    eager?: Array<{ secure_url?: string }>;
    playback_url?: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "financial-revolution/content",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result as {
          secure_url: string;
          public_id: string;
          duration?: number;
          eager?: Array<{ secure_url?: string }>;
          playback_url?: string;
        });
      },
    );
    stream.end(file.buffer);
  });

  const thumbnailUrl = cloudinary.url(uploaded.public_id, {
    resource_type: "video",
    format: "jpg",
    start_offset: "auto",
  });

  return {
    videoUrl: uploaded.secure_url,
    videoPublicId: uploaded.public_id,
    thumbnailUrl,
    durationSec: uploaded.duration ? Math.round(uploaded.duration) : null,
  };
};

export const deleteAdminContent = async (contentId: string) => {
  const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
  if (!item) throw new HttpError(404, "Content item not found");

  if (item.videoPublicId && isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(item.videoPublicId, {
        resource_type: "video",
      });
    } catch {
      // Keep DB delete even if Cloudinary cleanup fails.
    }
  }

  await prisma.contentItem.delete({ where: { id: contentId } });
  return { id: contentId, deleted: true };
};

const MEMBERS_PAGE_SIZE = 10;

export const listMembersForAdminDetailed = async (
  pageInput = 1,
  pageSizeInput = MEMBERS_PAGE_SIZE,
) => {
  const pageSize =
    Number.isFinite(pageSizeInput) && pageSizeInput > 0
      ? Math.min(Math.floor(pageSizeInput), 50)
      : MEMBERS_PAGE_SIZE;
  const page =
    Number.isFinite(pageInput) && pageInput > 0 ? Math.floor(pageInput) : 1;

  const total = await prisma.membership.count();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const records = await prisma.membership.findMany({
    include: { user: true },
    orderBy: { updatedAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  const settings = await getPlatformSettings();

  return {
    members: records.map((membership) => ({
      membershipId: membership.id,
      status: membership.status,
      enrollmentPaid: membership.enrollmentPaid,
      monthlyStartsAt: membership.monthlyStartsAt?.toISOString() ?? null,
      planName: settings.defaultPlanName,
      planPrice: settings.monthlyPriceLabel,
      user: membership.user
        ? {
            id: membership.user.id,
            fullName: membership.user.fullName,
            email: membership.user.email,
            role: membership.user.role,
            isEmailVerified: membership.user.isEmailVerified,
            referralInvites: membership.user.referralInvites,
            referralSignups: membership.user.referralSignups,
          }
        : null,
    })),
    page: currentPage,
    pageSize,
    total,
    totalPages,
  };
};
