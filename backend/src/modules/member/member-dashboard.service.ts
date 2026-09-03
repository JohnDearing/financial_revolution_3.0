import { prisma } from "../../lib/prisma.js";
import {
  CURRICULUM_TRACKS,
  formatDurationLabel,
  getNextLiveSession,
  LIVE_SESSIONS,
  resolveTrackId,
} from "../../data/curriculum.js";
import {
  findUserById,
  getMembershipByUserId,
  getUserWithMembership,
} from "../../data/store.js";
import { getMemberBillingSummary } from "./member.service.js";
import { HttpError } from "../../utils/httpError.js";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysBetween(a: Date, b: Date) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

async function listMemberVisibleContent() {
  const now = new Date();
  return prisma.contentItem.findMany({
    where: {
      OR: [
        { status: "published" },
        { status: "scheduled", scheduledFor: { lte: now } },
      ],
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function ensureLearningProgress(userId: string) {
  const existing = await prisma.learningProgress.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.learningProgress.create({
    data: {
      userId,
      completedModuleIds: [],
      streakDays: 0,
      lastActivityAt: null,
    },
  });
}

export async function getMemberLearningHub(userId: string) {
  const user = await findUserById(userId);
  const membership = await getMembershipByUserId(userId);
  if (!user || !membership) throw new HttpError(404, "Member not found");

  const { getPlatformSettings } = await import(
    "../../services/platform-settings.service.js"
  );
  const settings = await getPlatformSettings();
  const learningLocked =
    settings.requireEnrollmentForLearning && !membership.enrollmentPaid;

  const [progress, contentItems] = await Promise.all([
    ensureLearningProgress(userId),
    listMemberVisibleContent(),
  ]);

  const contentIds = new Set(contentItems.map((item) => item.id));
  const completedIds = new Set(
    asStringArray(progress.completedModuleIds).filter((id) => contentIds.has(id)),
  );

  const totalModules = contentItems.length;
  const completedModules = completedIds.size;
  const percent =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const tracks = CURRICULUM_TRACKS.map((track) => {
    const trackItems = contentItems.filter(
      (item) => resolveTrackId(item.track) === track.id,
    );
    const completed = trackItems.filter((item) => completedIds.has(item.id)).length;
    const total = trackItems.length;
    let status: "locked" | "available" | "in-progress" | "completed" = "available";

    if (learningLocked) status = "locked";
    else if (total === 0) status = "available";
    else if (completed === total) status = "completed";
    else if (completed > 0) status = "in-progress";

    return {
      id: track.id,
      title: track.title,
      focus: track.focus,
      modules: total,
      completed,
      status,
    };
  });

  const incomplete = contentItems
    .filter((item) => !completedIds.has(item.id))
    .sort((a, b) => {
      const aHasVideo = a.videoUrl ? 0 : 1;
      const bHasVideo = b.videoUrl ? 0 : 1;
      if (aHasVideo !== bHasVideo) return aHasVideo - bHasVideo;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  const nextItem = incomplete[0] ?? contentItems[contentItems.length - 1] ?? null;
  const nextTrackId = nextItem ? resolveTrackId(nextItem.track) : "foundation";

  const foundationItems = contentItems.filter(
    (item) => resolveTrackId(item.track) === "foundation",
  );
  const foundationTarget = foundationItems.slice(
    0,
    Math.min(4, Math.max(foundationItems.length, 0)),
  );

  const moneyZoneStarted = contentItems.some(
    (item) =>
      resolveTrackId(item.track) === "money-zone" && completedIds.has(item.id),
  );
  const diversificationStarted = contentItems.some(
    (item) =>
      resolveTrackId(item.track) === "diversification" &&
      completedIds.has(item.id),
  );

  const milestones = [
    { label: "Onboarding assessment", done: user.isEmailVerified },
    { label: "Enrollment fee paid", done: membership.enrollmentPaid },
    {
      label: "Foundation modules 1–4",
      done:
        foundationTarget.length > 0 &&
        foundationTarget.every((item) => completedIds.has(item.id)),
    },
    {
      label: "First Money Zone workshop",
      done: moneyZoneStarted,
    },
    {
      label: "Diversification starter plan",
      done: diversificationStarted,
    },
  ];

  // Workshop replays = published admin uploads that have a playable video.
  const recordings = contentItems
    .filter((item) => Boolean(item.videoUrl))
    .slice(0, 12)
    .map((item) => ({
      id: item.id,
      title: item.title,
      duration: formatDurationLabel(item.durationSec),
      track: item.track ?? "Curriculum",
      date: (item.publishedAt ?? item.createdAt).toISOString().slice(0, 10),
      videoUrl: item.videoUrl,
      thumbnailUrl: item.thumbnailUrl,
      type: item.type,
      completed: completedIds.has(item.id),
    }));

  return {
    summary: {
      completedModules,
      totalModules,
      percent,
      streakDays: progress.streakDays,
      membershipStatus: membership.status,
      enrollmentPaid: membership.enrollmentPaid,
    },
    continueLearning: nextItem
      ? {
          moduleId: nextItem.id,
          contentId: nextItem.id,
          title: nextItem.title,
          trackId: nextTrackId,
          trackTitle:
            CURRICULUM_TRACKS.find((track) => track.id === nextTrackId)?.title ??
            nextItem.track ??
            "Curriculum",
          progressPercent: percent,
          videoUrl: nextItem.videoUrl,
          thumbnailUrl: nextItem.thumbnailUrl,
          completed: completedIds.has(nextItem.id),
        }
      : {
          moduleId: "",
          contentId: null,
          title: "No published content yet",
          trackId: "foundation",
          trackTitle: "Curriculum",
          progressPercent: 0,
          videoUrl: null,
          thumbnailUrl: null,
          completed: false,
        },
    tracks,
    liveSessions: LIVE_SESSIONS,
    nextLiveSession: getNextLiveSession(),
    recordings,
    milestones,
  };
}

export async function markLearningContentComplete(
  userId: string,
  contentId: string,
) {
  const membership = await getMembershipByUserId(userId);
  if (!membership) throw new HttpError(404, "Member not found");
  const { getPlatformSettings } = await import(
    "../../services/platform-settings.service.js"
  );
  const settings = await getPlatformSettings();
  if (settings.requireEnrollmentForLearning && !membership.enrollmentPaid) {
    throw new HttpError(403, "Complete enrollment to track learning progress.");
  }

  const content = await prisma.contentItem.findFirst({
    where: {
      id: contentId,
      OR: [
        { status: "published" },
        { status: "scheduled", scheduledFor: { lte: new Date() } },
      ],
    },
  });
  if (!content) throw new HttpError(404, "Content not found.");

  const progress = await ensureLearningProgress(userId);
  const completedIds = new Set(asStringArray(progress.completedModuleIds));
  const alreadyDone = completedIds.has(contentId);
  completedIds.add(contentId);

  const now = new Date();
  let streakDays = progress.streakDays;

  if (!alreadyDone) {
    if (!progress.lastActivityAt) {
      streakDays = 1;
    } else {
      const gap = daysBetween(progress.lastActivityAt, now);
      if (gap === 0) {
        streakDays = Math.max(1, progress.streakDays);
      } else if (gap === 1) {
        streakDays = progress.streakDays + 1;
      } else {
        streakDays = 1;
      }
    }
  }

  await prisma.learningProgress.update({
    where: { userId },
    data: {
      completedModuleIds: Array.from(completedIds),
      streakDays,
      lastActivityAt: now,
    },
  });

  return getMemberLearningHub(userId);
}

export async function getMemberDashboard(userId: string) {
  const user = await getUserWithMembership(userId);
  const membership = user?.memberships[0];
  if (!user || !membership) throw new HttpError(404, "Member not found");

  const { getPlatformSettings } = await import(
    "../../services/platform-settings.service.js"
  );
  const settings = await getPlatformSettings();

  const [learning, billing] = await Promise.all([
    getMemberLearningHub(userId),
    getMemberBillingSummary(userId),
  ]);

  const weeklyPlan = [
    {
      id: "verify-email",
      label: "Verify your email address",
      done: user.isEmailVerified,
    },
    {
      id: "complete-enrollment",
      label: `Complete ${settings.enrollmentFeeLabel} enrollment checkout`,
      done: membership.enrollmentPaid,
    },
    {
      id: "resume-learning",
      label: `Resume ${learning.continueLearning.title}`,
      done:
        learning.summary.totalModules > 0 &&
        learning.summary.completedModules >=
          Math.min(1, learning.summary.totalModules),
    },
    {
      id: "join-live-session",
      label: learning.nextLiveSession
        ? `Join ${learning.nextLiveSession.title}`
        : "Join this week's live class",
      done: false,
    },
  ];

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      referralInvites: user.referralInvites,
      referralSignups: user.referralSignups,
    },
    membership: {
      status: membership.status,
      enrollmentPaid: membership.enrollmentPaid,
      planName: settings.defaultPlanName,
      planPrice: settings.monthlyPriceLabel,
      enrollmentFee: settings.enrollmentFeeLabel,
      nextChargeDate: billing.nextChargeDate,
      monthlyStartsAt: billing.monthlyStartsAt,
      needsEnrollment: billing.needsEnrollment,
    },
    learning: {
      completedModules: learning.summary.completedModules,
      totalModules: learning.summary.totalModules,
      percent: learning.summary.percent,
      nextLiveSession: learning.nextLiveSession,
      continueTitle: learning.continueLearning.title,
    },
    weeklyPlan,
    onboarding: {
      welcomeMessage: settings.onboardingWelcomeMessage,
      supportEmail: settings.supportEmail,
    },
    account: {
      isEmailVerified: user.isEmailVerified,
      enrollmentPaid: membership.enrollmentPaid,
      portalAccessActive:
        membership.status === "active" || membership.status === "past_due",
      premiumUnlocked: membership.enrollmentPaid && membership.status === "active",
    },
  };
}
