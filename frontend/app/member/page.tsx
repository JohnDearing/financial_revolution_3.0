"use client";

import { BadgeDollarSign, CircleCheck, Clock3, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PortalStatCard } from "@/components/portal/PortalStatCard";

type DashboardData = {
  user: {
    fullName: string;
    isEmailVerified: boolean;
    referralInvites: number;
    referralSignups: number;
  };
  membership: {
    status: string;
    enrollmentPaid: boolean;
    planName: string;
    planPrice: string;
    nextChargeDate: string | null;
    needsEnrollment: boolean;
  };
  learning: {
    completedModules: number;
    totalModules: number;
    percent: number;
    nextLiveSession: { label: string; title: string } | null;
    continueTitle: string;
  };
  weeklyPlan: Array<{ id: string; label: string; done: boolean }>;
  onboarding?: {
    welcomeMessage: string;
    supportEmail: string;
  };
  account: {
    isEmailVerified: boolean;
    enrollmentPaid: boolean;
    portalAccessActive: boolean;
    premiumUnlocked: boolean;
  };
};

export default function MemberDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/member/dashboard");
      const result = (await response.json()) as DashboardData & { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? "Unable to load dashboard.");
        setLoading(false);
        return;
      }
      setData(result);
      setLoading(false);
    };
    void load();
  }, []);

  const completed = data?.learning.completedModules ?? 0;
  const total = data?.learning.totalModules ?? 18;
  const percent = data?.learning.percent ?? 0;

  return (
    <div className="space-y-5">
      {data?.onboarding?.welcomeMessage ? (
        <section className="rounded-2xl border border-gold/30 bg-gold/10 p-4 md:p-5">
          <p className="text-sm leading-relaxed text-gold">
            {data.onboarding.welcomeMessage}
          </p>
          {data.onboarding.supportEmail ? (
            <p className="mt-2 text-xs text-zinc-400">
              Need help?{" "}
              <a
                href={`mailto:${data.onboarding.supportEmail}`}
                className="text-gold underline-offset-2 hover:underline"
              >
                {data.onboarding.supportEmail}
              </a>
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard
          icon={CircleCheck}
          label="Completed modules"
          value={loading ? "..." : `${completed} / ${total}`}
          helper={
            loading
              ? "Loading curriculum progress..."
              : `You are ${percent}% through your core path.`
          }
        />
        <PortalStatCard
          icon={Clock3}
          label="Next session"
          value={
            loading
              ? "..."
              : data?.learning.nextLiveSession?.label ?? "No session"
          }
          helper={
            data?.learning.nextLiveSession?.title ??
            "Live classes appear once schedule is available."
          }
        />
        <PortalStatCard
          icon={BadgeDollarSign}
          label="Current plan"
          value={loading ? "..." : data?.membership.planPrice ?? "$99"}
          helper={
            data?.membership.needsEnrollment
              ? "Enrollment required to activate membership."
              : `Status: ${data?.membership.status ?? "—"}${
                  data?.membership.nextChargeDate
                    ? ` · Next charge ${data.membership.nextChargeDate}`
                    : ""
                }`
          }
        />
        <PortalStatCard
          icon={UserPlus}
          label="Referrals"
          value={
            loading
              ? "..."
              : `${String(data?.user.referralInvites ?? 0).padStart(2, "0")} invites`
          }
          helper={`${data?.user.referralSignups ?? 0} completed sign-up.`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h2 className="text-lg font-semibold text-white">Your weekly plan</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Personalized actions based on your membership and learning progress.
          </p>
          <ul className="mt-4 space-y-3">
            {(data?.weeklyPlan ?? []).map((task) => (
              <li
                key={task.id}
                className="inline-flex items-center gap-2 text-sm text-zinc-300"
              >
                <CircleCheck
                  size={15}
                  className={task.done ? "text-gold" : "text-zinc-600"}
                  aria-hidden="true"
                />
                <span className={task.done ? "text-zinc-300" : "text-zinc-500"}>
                  {task.label}
                </span>
              </li>
            ))}
            {!loading && (data?.weeklyPlan.length ?? 0) === 0 ? (
              <li className="text-sm text-zinc-500">No actions for this week.</li>
            ) : null}
          </ul>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h2 className="text-lg font-semibold text-white">Account status</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {data?.account.isEmailVerified
              ? "Email verified and portal access is ready."
              : "Email verification pending. Verify to unlock all features."}
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-zinc-300">
              Enrollment:{" "}
              <span className="text-gold">
                {data?.account.enrollmentPaid ? "Paid" : "Required"}
              </span>
            </p>
            <p className="text-zinc-300">
              Membership:{" "}
              <span className="uppercase text-gold">
                {data?.membership.status ?? "—"}
              </span>
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
            {data?.account.premiumUnlocked
              ? "Premium member benefits unlocked."
              : "Complete enrollment to unlock premium benefits."}
          </div>
        </article>
      </section>
    </div>
  );
}
