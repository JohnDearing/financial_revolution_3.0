"use client";

import {
  BookOpen,
  ChevronRight,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PortalSearch } from "@/components/portal/PortalSearch";
import { ProfileMenu } from "@/components/portal/ProfileMenu";

export type PortalNavItem = {
  label: string;
  href: string;
  icon:
    | "dashboard"
    | "members"
    | "content"
    | "billing"
    | "settings"
    | "learning"
    | "support";
};

type PortalShellProps = {
  roleLabel: "Member Portal" | "Admin Portal";
  heading: string;
  subheading: string;
  navItems: PortalNavItem[];
  profileHref: string;
  userName: string;
  children: React.ReactNode;
};

export function PortalShell({
  roleLabel,
  heading,
  subheading,
  navItems,
  profileHref,
  userName,
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const iconMap: Record<PortalNavItem["icon"], LucideIcon> = {
    dashboard: LayoutDashboard,
    members: Users,
    content: FolderKanban,
    billing: CreditCard,
    settings: Settings,
    learning: BookOpen,
    support: LifeBuoy,
  };
  const searchRole = roleLabel === "Admin Portal" ? "admin" : "member";

  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="section-shell py-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-surface p-4 md:p-5">
            <div className="flex flex-col items-center border-b border-border pb-5 text-center">
              <Link
                href={roleLabel === "Admin Portal" ? "/admin" : "/member"}
                className="inline-flex w-full items-center justify-center"
                aria-label="Financial Revolution 3.0 home"
              >
                <Image
                  src="/images/logo.png"
                  alt="Financial Revolution 3.0"
                  width={280}
                  height={100}
                  className="h-24 w-auto max-w-full object-contain md:h-28"
                  priority
                />
              </Link>
              <p className="text-sm font-semibold tracking-wide text-gold">
                {roleLabel}
              </p>
            </div>

            <nav className="mt-4 space-y-2">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "border border-gold/40 bg-gold/10 text-gold"
                        : "border border-transparent text-zinc-200 hover:border-border hover:bg-surface-muted"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon size={16} aria-hidden="true" />
                      {item.label}
                    </span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="space-y-5">
            <header className="rounded-2xl border border-border bg-surface p-4 md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-white md:text-3xl">
                    {heading}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">{subheading}</p>
                </div>
                <div className="flex items-center gap-3">
                  <PortalSearch role={searchRole} />
                  <ProfileMenu profileHref={profileHref} userName={userName} />
                </div>
              </div>
            </header>

            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
