"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/portal/AuthShell";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetEmail = searchParams.get("email") ?? "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const code = String(formData.get("verificationCode") ?? "").trim();

    if (!email || code.length !== 6) {
      toast.error("Enter email and a valid 6-digit code.");
      return;
    }

    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to verify email.");
      return;
    }

    toast.success(result.message ?? "Email verified successfully.");
    router.push("/auth/sign-in");
  };

  const resend = async () => {
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    const email = emailInput?.value.trim() ?? presetEmail;
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to resend code.");
      return;
    }
    toast.success(result.message ?? "Verification code resent.");
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code sent to your email to activate your account."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
            Email address
          </span>
          <input
            type="email"
            name="email"
            defaultValue={presetEmail}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-gold/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
            Verification code
          </span>
          <input
            type="text"
            name="verificationCode"
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tracking-[0.3em] text-white outline-none focus:border-gold/60"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
        >
          Verify email
        </button>

        <p className="text-center text-sm text-zinc-400">
          Didn&apos;t receive code?{" "}
          <button
            type="button"
            onClick={() => void resend()}
            className="text-gold hover:text-gold-soft"
          >
            Resend
          </button>
          {" · "}
          <Link href="/auth/sign-in" className="text-gold hover:text-gold-soft">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Verify your email" subtitle="Loading verification form...">
          <div className="h-40 animate-pulse rounded-xl bg-background" />
        </AuthShell>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
