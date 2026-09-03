import { prisma } from "../../lib/prisma.js";
import type { PortalSearchResult } from "../member/member-search.service.js";

function matches(query: string, ...parts: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return parts.some((part) => (part ?? "").toLowerCase().includes(q));
}

const adminPages: PortalSearchResult[] = [
  {
    id: "page-overview",
    category: "Pages",
    title: "Operations Dashboard",
    subtitle: "Growth, health, and priorities",
    href: "/admin",
  },
  {
    id: "page-members",
    category: "Pages",
    title: "Members",
    subtitle: "Member roster and membership status",
    href: "/admin/members",
  },
  {
    id: "page-content",
    category: "Pages",
    title: "Content",
    subtitle: "Upload and publish learning videos",
    href: "/admin/content",
  },
  {
    id: "page-billing",
    category: "Pages",
    title: "Billing Ops",
    subtitle: "Past due, canceled, and active subscriptions",
    href: "/admin/billing",
  },
  {
    id: "page-settings",
    category: "Pages",
    title: "Settings",
    subtitle: "Access policies and platform defaults",
    href: "/admin/settings",
  },
  {
    id: "page-profile",
    category: "Pages",
    title: "Admin profile",
    subtitle: "Account details",
    href: "/admin/profile",
  },
];

export async function searchAdminPortal(query: string) {
  const q = query.trim();
  if (q.length < 1) {
    return { query: q, results: adminPages.slice(0, 5) };
  }

  const results: PortalSearchResult[] = [];

  for (const page of adminPages) {
    if (matches(q, page.title, page.subtitle, page.category)) {
      results.push(page);
    }
  }

  const normalized = q.toLowerCase().replace(/\s+/g, "_");
  const membershipStatuses = ["pending", "active", "past_due", "canceled", "inactive"] as const;
  const matchedStatus = membershipStatuses.find(
    (status) => status === normalized || status.includes(normalized),
  );

  const members = await prisma.user.findMany({
    where: {
      role: "member",
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        ...(matchedStatus
          ? [{ memberships: { some: { status: matchedStatus } } }]
          : []),
        {
          memberships: {
            some: {
              OR: [
                { stripeCustomerId: { contains: q, mode: "insensitive" } },
                { stripeSubscriptionId: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    },
    include: {
      memberships: {
        take: 1,
        orderBy: { updatedAt: "desc" },
      },
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  for (const member of members) {
    const membership = member.memberships[0];
    results.push({
      id: `member-${member.id}`,
      category: "Members",
      title: member.fullName,
      subtitle: `${member.email} · ${membership?.status ?? "pending"}${
        membership?.enrollmentPaid ? " · enrolled" : ""
      }`,
      href: "/admin/members",
    });
  }

  const contentStatuses = ["draft", "scheduled", "published"] as const;
  const matchedContentStatus = contentStatuses.find(
    (status) => status === normalized || status.includes(normalized),
  );

  const content = await prisma.contentItem.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { track: { contains: q, mode: "insensitive" } },
        { type: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        ...(matchedContentStatus ? [{ status: matchedContentStatus }] : []),
      ],
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  for (const item of content) {
    results.push({
      id: `content-${item.id}`,
      category: "Content",
      title: item.title,
      subtitle: `${item.status} · ${item.type}${item.track ? ` · ${item.track}` : ""}`,
      href: "/admin/content",
    });
  }

  if (matches(q, "past due", "pastdue", "failed", "delinquent")) {
    results.push({
      id: "billing-past-due",
      category: "Billing Ops",
      title: "Past-due memberships",
      subtitle: "Review failed payments and retries",
      href: "/admin/billing",
    });
  }

  if (
    matches(
      q,
      "telegram",
      "smtp",
      "email",
      "cloudinary",
      "stripe",
      "maintenance",
      "onboarding",
      "notification",
      "access policy",
      "signups",
    )
  ) {
    results.push({
      id: "settings-integrations",
      category: "Settings",
      title: "Platform settings",
      subtitle: "Access policies, emails, onboarding, and integrations",
      href: "/admin/settings",
    });
  }

  const unique = Array.from(new Map(results.map((item) => [item.id, item])).values());
  return { query: q, results: unique.slice(0, 12) };
}
