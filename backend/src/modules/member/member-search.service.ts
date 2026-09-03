import { LIVE_SESSIONS, CURRICULUM_MODULES, CURRICULUM_TRACKS } from "../../data/curriculum.js";
import { prisma } from "../../lib/prisma.js";
import { getMembershipByUserId } from "../../data/store.js";

export type PortalSearchResult = {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  href: string;
};

function matches(query: string, ...parts: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return parts.some((part) => (part ?? "").toLowerCase().includes(q));
}

const memberPages: PortalSearchResult[] = [
  {
    id: "page-dashboard",
    category: "Pages",
    title: "Dashboard",
    subtitle: "Progress, plan, and weekly priorities",
    href: "/member",
  },
  {
    id: "page-learning",
    category: "Pages",
    title: "Learning Hub",
    subtitle: "Curriculum, live classes, and replays",
    href: "/member/learning",
  },
  {
    id: "page-billing",
    category: "Pages",
    title: "Billing",
    subtitle: "Enrollment, subscription, and invoices",
    href: "/member/billing",
  },
  {
    id: "page-support",
    category: "Pages",
    title: "Support & Telegram",
    subtitle: "Community access and mentorship help",
    href: "/member/support",
  },
  {
    id: "page-profile",
    category: "Pages",
    title: "Profile",
    subtitle: "Account details and password",
    href: "/member/profile",
  },
];

export async function searchMemberPortal(userId: string, query: string) {
  const q = query.trim();
  if (q.length < 1) {
    return { query: q, results: memberPages.slice(0, 5) };
  }

  const membership = await getMembershipByUserId(userId);
  const results: PortalSearchResult[] = [];

  for (const page of memberPages) {
    if (matches(q, page.title, page.subtitle, page.category)) {
      results.push(page);
    }
  }

  for (const session of LIVE_SESSIONS) {
    if (session.isOff) continue;
    if (matches(q, session.title, session.dayLabel, session.type, session.timeZones)) {
      results.push({
        id: `live-${session.day}-${session.title}`,
        category: "Live classes",
        title: session.title,
        subtitle: `${session.dayLabel} · ${session.timeZones}`,
        href: "/member/learning",
      });
    }
  }

  for (const track of CURRICULUM_TRACKS) {
    if (matches(q, track.title, track.focus)) {
      results.push({
        id: `track-${track.id}`,
        category: "Curriculum",
        title: track.title,
        subtitle: track.focus,
        href: "/member/learning",
      });
    }
  }

  for (const module of CURRICULUM_MODULES) {
    if (matches(q, module.title, module.id)) {
      const track = CURRICULUM_TRACKS.find((item) => item.id === module.trackId);
      results.push({
        id: `module-${module.id}`,
        category: "Curriculum",
        title: module.title,
        subtitle: track?.title ?? "Curriculum module",
        href: "/member/learning",
      });
    }
  }

  const content = await prisma.contentItem.findMany({
    where: {
      OR: [
        { status: "published" },
        { status: "scheduled", scheduledFor: { lte: new Date() } },
      ],
      AND: [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { track: { contains: q, mode: "insensitive" } },
            { type: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    take: 8,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  for (const item of content) {
    results.push({
      id: `content-${item.id}`,
      category: "Content",
      title: item.title,
      subtitle: [item.type, item.track].filter(Boolean).join(" · ") || "Published content",
      href: "/member/learning",
    });
  }

  if (matches(q, "telegram", "community", "invite", "group", "channel")) {
    results.push({
      id: "telegram-access",
      category: "Community",
      title: "Private Telegram access",
      subtitle: membership?.enrollmentPaid
        ? "Open your group and channel invites"
        : "Unlocks after enrollment payment",
      href: "/member/support",
    });
  }

  if (matches(q, "invoice", "payment", "subscription", "cancel", "card", "enroll")) {
    results.push({
      id: "billing-actions",
      category: "Billing",
      title: "Manage membership billing",
      subtitle: "Payments, invoices, and enrollment",
      href: "/member/billing",
    });
  }

  // De-dupe by id and cap.
  const unique = Array.from(new Map(results.map((item) => [item.id, item])).values());
  return { query: q, results: unique.slice(0, 12) };
}
