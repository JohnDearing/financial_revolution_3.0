"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/portal/AuthShell";
import { PasswordInput } from "@/components/portal/PasswordInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");

  const requestCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextEmail = String(formData.get("email") ?? "").trim();

    if (!nextEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: nextEmail }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to submit request.");
      return;
    }

    setEmail(nextEmail);
    setStep("reset");
    toast.success(result.message ?? "If that email exists, a reset code was sent.");
  };

  const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "").trim();

    if (code.length !== 6 || newPassword.length < 8) {
      toast.error("Enter the 6-digit code and a new password (8+ characters).");
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to reset password.");
      return;
    }

    toast.success(result.message ?? "Password reset successfully.");
    router.push("/auth/sign-in");
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle={
        step === "request"
          ? "Enter the email tied to your account. We will send a 6-digit reset code."
          : `Enter the code sent to ${email} and choose a new password.`
      }
    >
      {step === "request" ? (
        <form className="space-y-4" onSubmit={requestCode}>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Email address
            </span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-gold/60"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
          >
            Send reset code
          </button>

          <p className="text-center text-sm text-zinc-400">
            Back to{" "}
            <Link href="/auth/sign-in" className="text-gold hover:text-gold-soft">
              Sign in
            </Link>
          </p>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={resetPassword}>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Reset code
            </span>
            <input
              type="text"
              name="code"
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tracking-[0.3em] text-white outline-none focus:border-gold/60"
            />
          </label>

          <PasswordInput
            label="New password"
            name="newPassword"
            placeholder="Create a new secure password"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
          >
            Reset password
          </button>

          <p className="text-center text-sm text-zinc-400">
            <button
              type="button"
              onClick={() => setStep("request")}
              className="text-gold hover:text-gold-soft"
            >
              Resend code
            </button>
            {" · "}
            <Link href="/auth/sign-in" className="text-gold hover:text-gold-soft">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
