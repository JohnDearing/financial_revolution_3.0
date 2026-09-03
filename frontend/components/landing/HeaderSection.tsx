"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#benefits", label: "Benefits" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

export function HeaderSection() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black backdrop-blur">
      <div className="section-shell flex h-20 items-center justify-between">
        <Link href="/" className="flex items-end justify-end gap-3">
          <Image
            src="/images/logo.png"
            alt="Financial Revolution 3.0 Logo"
            width={100}
            height={100}
            className="mt-2 object-contain"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-zinc-200 hover:text-gold"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/auth/sign-in"
            className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
          >
            Join Now
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-md border border-border px-3 py-2 text-sm text-zinc-100 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Menu size={20} className="text-zinc-100" aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="section-shell border-t border-border/70 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-md px-2 py-2 text-sm text-zinc-200 hover:bg-surface hover:text-gold"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/auth/sign-in"
              className="mt-2 inline-flex w-full justify-center rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
              onClick={() => setOpen(false)}
            >
              Join Now
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
