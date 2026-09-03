"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ProfileMenuProps = {
  profileHref: string;
  userName: string;
};

export function ProfileMenu({ profileHref, userName }: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const label = userName.trim() || "Profile";

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const signOut = async () => {
    setOpen(false);
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/auth/sign-in");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open menu for ${label}`}
        className="inline-flex max-w-[200px] items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-2 text-sm text-zinc-200 hover:border-gold/40 hover:text-gold"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-gold/10 text-gold">
          <UserRound size={15} aria-hidden="true" />
        </span>
        <span className="hidden truncate sm:inline">{label}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium text-white">{label}</p>
            <p className="text-[11px] text-zinc-500">Account menu</p>
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-200 hover:bg-surface-muted hover:text-gold"
          >
            <UserRound size={15} aria-hidden="true" />
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void signOut();
            }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-surface-muted hover:text-gold"
          >
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
