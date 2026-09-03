import { type PortalNavItem, PortalShell } from "@/components/portal/PortalShell";
import { getPortalUserName } from "@/lib/server/portalUser";

const memberNav: PortalNavItem[] = [
  { label: "Dashboard", href: "/member", icon: "dashboard" },
  { label: "Learning Hub", href: "/member/learning", icon: "learning" },
  { label: "Billing", href: "/member/billing", icon: "billing" },
  { label: "Support", href: "/member/support", icon: "support" },
];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userName = await getPortalUserName();

  return (
    <PortalShell
      roleLabel="Member Portal"
      heading="Member Workspace"
      subheading="Track your progress, upcoming sessions, and subscription status."
      navItems={memberNav}
      profileHref="/member/profile"
      userName={userName}
    >
      {children}
    </PortalShell>
  );
}
