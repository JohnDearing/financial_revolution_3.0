"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/components/portal/AuthShell";
import { PasswordInput } from "@/components/portal/PasswordInput";

export default function SignUpPage() {
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!fullName || !email || !password) {
      toast.error("Please complete all required fields.");
      return;
    }

    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    const result = (await response.json()) as { message?: string; email?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to create account.");
      return;
    }

    toast.success(result.message ?? "Account created. Check your email for the code.");
    const verifyEmail = encodeURIComponent(result.email ?? email);
    router.push(`/auth/verify-email?email=${verifyEmail}`);
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Get started with a secure member profile in minutes."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
            Full name
          </span>
          <input
            type="text"
            name="fullName"
            placeholder="Your full name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-gold/60"
          />
        </label>
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
        <PasswordInput
          label="Password"
          name="password"
          placeholder="Create a secure password"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
        >
          Create account
        </button>

        <p className="text-center text-sm text-zinc-400">
          Already have access?{" "}
          <Link href="/auth/sign-in" className="text-gold hover:text-gold-soft">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
