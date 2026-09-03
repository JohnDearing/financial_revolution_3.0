"use client";

import { BadgeDollarSign, CircleCheck, Mail, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PortalStatCard } from "@/components/portal/PortalStatCard";

type OverviewData = {
  activeMembers: number;
  pendingVerifications: number;
  pendingEnrollments: number;
  pastDueCount: number;
  mrrEstimate: number;
  enrollmentRevenue: number;
  automationHealth: {
    label: string;
    percent: string;
    stripeConfigured: boolean;
  };
  priorities: string[];
  emailFlow: {
    verificationEnabled: boolean;
    passwordResetEnabled: boolean;
    smtpConfigured: boolean;
  };
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/overview");
      const result = (await response.json()) as OverviewData & { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? "Unable to load admin overview.");
        return;
      }
      setOverview(result);
    };
    void load();
  }, []);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard
          icon={Users}
          label="Active members"
          value={String(overview?.activeMembers ?? "...")}
          helper={`${overview?.pendingEnrollments ?? 0} enrollments still pending.`}
        />
        <PortalStatCard
          icon={Mail}
          label="Pending verifications"
          value={String(overview?.pendingVerifications ?? "...")}
          helper="Users waiting for email confirmation."
        />
        <PortalStatCard
          icon={BadgeDollarSign}
          label="MRR snapshot"
          value={overview ? `$${overview.mrrEstimate}` : "..."}
          helper={`Enrollment revenue tracked: $${overview?.enrollmentRevenue ?? 0}.`}
        />
        <PortalStatCard
          icon={CircleCheck}
          label="Automation health"
          value={overview?.automationHealth.percent ?? "..."}
          helper={
            overview
              ? `${overview.automationHealth.label} · Stripe ${
                  overview.automationHealth.stripeConfigured ? "connected" : "missing"
                }`
              : "API and billing process heartbeat."
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h2 className="text-lg font-semibold text-white">Admin priorities</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {(overview?.priorities ?? ["Loading priorities..."]).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h2 className="text-lg font-semibold text-white">Email flow health</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Verification and password reset are enabled
            {overview?.emailFlow.smtpConfigured
              ? " with SMTP configured."
              : ". Add SMTP credentials to send live email."}
          </p>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <p>
              Past due memberships:{" "}
              <span className="text-gold">{overview?.pastDueCount ?? 0}</span>
            </p>
            <p>
              Password reset:{" "}
              <span className="text-gold">
                {overview?.emailFlow.passwordResetEnabled ? "Ready" : "Disabled"}
              </span>
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
