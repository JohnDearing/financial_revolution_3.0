"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/portal/PasswordInput";

type ProfileData = {
  id: string;
  fullName: string;
  email: string;
  role: "member" | "admin";
  isEmailVerified?: boolean;
  planId?: string;
  subscriptionStatus?: string;
  membershipStatus?: string;
  enrollmentPaid?: boolean;
};

type ProfilePageProps = {
  roleLabel: "Member" | "Admin";
};

export function ProfilePage({ roleLabel }: ProfilePageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/auth/me");
      const result = (await response.json()) as ProfileData & { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? "Unable to load profile.");
        setLoading(false);
        return;
      }
      setProfile(result);
      setFullName(result.fullName);
      setEmail(result.email);
      setLoading(false);
    };
    void load();
  }, []);

  const updateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);

    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email }),
    });
    const result = (await response.json()) as ProfileData & { message?: string };

    if (!response.ok) {
      toast.error(result.message ?? "Unable to update profile.");
      setSavingProfile(false);
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            fullName: result.fullName ?? fullName,
            email: result.email ?? email,
            isEmailVerified: result.isEmailVerified ?? prev.isEmailVerified,
          }
        : prev,
    );
    toast.success(result.message ?? "Profile updated successfully.");
    setSavingProfile(false);
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      setSavingPassword(false);
      return;
    }

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = (await response.json()) as {
      message?: string;
      requireReauth?: boolean;
    };

    if (!response.ok) {
      toast.error(result.message ?? "Unable to update password.");
      setSavingPassword(false);
      return;
    }

    toast.success(result.message ?? "Password updated successfully.");
    setSavingPassword(false);
    event.currentTarget.reset();

    if (result.requireReauth) {
      router.push("/auth/sign-in");
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <p className="text-sm text-zinc-400">Loading profile...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <p className="text-sm text-zinc-400">Unable to load profile details.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gold">
              {roleLabel} Profile
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">{profile.fullName}</h2>
            <p className="mt-1 text-sm text-zinc-400">{profile.email}</p>
          </div>
          <span className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-gold">
            {profile.role}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Email status</p>
            <p className="mt-1 text-white">
              {profile.isEmailVerified ? "Verified" : "Pending verification"}
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Account ID</p>
            <p className="mt-1 break-all text-white">{profile.id}</p>
          </article>
          {profile.planId ? (
            <article className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Plan</p>
              <p className="mt-1 uppercase text-white">{profile.planId}</p>
            </article>
          ) : null}
          {(profile.subscriptionStatus || profile.membershipStatus) && (
            <article className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Membership</p>
              <p className="mt-1 uppercase text-white">
                {profile.membershipStatus ?? profile.subscriptionStatus}
              </p>
            </article>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Update profile</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Change your display name or account email.
        </p>
        <form className="mt-4 space-y-4" onSubmit={updateProfile}>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Full name
            </span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              minLength={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-gold/60"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Email address
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-gold/60"
            />
          </label>
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft disabled:opacity-60"
          >
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Update password</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Use a strong password. You will be signed out after a successful change.
        </p>
        <form className="mt-4 space-y-4" onSubmit={updatePassword}>
          <PasswordInput
            label="Current password"
            name="currentPassword"
            placeholder="Enter current password"
            required
            autoComplete="current-password"
          />
          <PasswordInput
            label="New password"
            name="newPassword"
            placeholder="Enter new password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirm new password"
            name="confirmPassword"
            placeholder="Confirm new password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-zinc-100 hover:border-gold/40 hover:text-gold disabled:opacity-60"
          >
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
