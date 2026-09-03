"use client";

import { CircleCheck, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/portal/AuthShell";

export default function CheckEmailPage() {
  const [email, setEmail] = useState("");

  const resendEmail = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email first.");
      return;
    }

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to resend email.");
      return;
    }
    toast.success(result.message ?? "Verification code resent successfully.");
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle="We sent a 6-digit verification code to activate your account."
    >
      <div className="rounded-xl border border-border bg-background p-4 text-sm">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Mail size={18} aria-hidden="true" />
        </div>
        <p className="mt-3 text-zinc-300">
          Open your inbox for the Financial Revolution verification email, then
          enter the 6-digit code on the verify page.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 text-zinc-400">
          <CircleCheck size={15} aria-hidden="true" />
          Codes expire in 30 minutes for security.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <input
          type="email"
          placeholder="Enter your email to resend"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/auth/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold-soft"
          >
            Enter verification code
          </Link>
          <button
            type="button"
            onClick={() => {
              void resendEmail();
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm text-zinc-200 hover:border-gold/40"
          >
            Resend code
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
