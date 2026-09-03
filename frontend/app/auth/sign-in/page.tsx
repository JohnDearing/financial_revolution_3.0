"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/components/portal/AuthShell";
import { PasswordInput } from "@/components/portal/PasswordInput";

export default function SignInPage() {
  const router = useRouter();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = (await response.json()) as { message?: string; role?: string };

    if (!response.ok) {
      toast.error(result.message ?? "Unable to sign in.");
      return;
    }

    toast.success(result.message ?? "Signed in successfully.");
    router.push(result.role === "admin" ? "/admin" : "/member");
  };

  return (
    <AuthShell
      title="Sign in to your portal"
      subtitle="Use your member or admin credentials to continue."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-zinc-300">
            <input type="checkbox" className="rounded border-border bg-background" />
            Remember me
          </label>
          <Link href="/auth/forgot-password" className="text-gold hover:text-gold-soft">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
        >
          Sign in
        </button>

        <p className="text-center text-sm text-zinc-400">
          New member?{" "}
          <Link href="/auth/sign-up" className="text-gold hover:text-gold-soft">
            Create account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
