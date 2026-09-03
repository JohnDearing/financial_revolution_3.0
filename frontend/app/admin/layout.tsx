import { type PortalNavItem, PortalShell } from "@/components/portal/PortalShell";
import { getPortalUserName } from "@/lib/server/portalUser";

const adminNav: PortalNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Members", href: "/admin/members", icon: "members" },
  { label: "Content", href: "/admin/content", icon: "content" },
  { label: "Billing Ops", href: "/admin/billing", icon: "billing" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userName = await getPortalUserName();

  return (
    <PortalShell
      roleLabel="Admin Portal"
      heading="Operations Dashboard"
      subheading="Oversee membership growth, content publishing, and platform health."
      navItems={adminNav}
      profileHref="/admin/profile"
      userName={userName}
    >
      {children}
    </PortalShell>
  );
}
