"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type BillingOps = {
  summary: {
    activeSubscriptions: number;
    pastDueCount: number;
    canceledCount: number;
    pendingEnrollments: number;
    mrrEstimate: number;
    enrollmentRevenue: number;
  };
  pastDueMembers: Array<{
    membershipId: string;
    fullName: string;
    email: string;
    status: string;
  }>;
  pendingEnrollments: Array<{
    membershipId: string;
    fullName: string;
    email: string;
    enrollmentPaid: boolean;
    status: string;
  }>;
};

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingOps | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/billing");
      const result = (await response.json()) as BillingOps & { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? "Unable to load billing ops.");
        return;
      }
      setData(result);
    };
    void load();
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white">Billing Operations</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Live subscription and enrollment metrics from membership records.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <p className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            Active subscriptions:{" "}
            <span className="text-gold">{data?.summary.activeSubscriptions ?? "..."}</span>
          </p>
          <p className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            Past due:{" "}
            <span className="text-gold">{data?.summary.pastDueCount ?? "..."}</span>
          </p>
          <p className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            Pending enrollments:{" "}
            <span className="text-gold">{data?.summary.pendingEnrollments ?? "..."}</span>
          </p>
          <p className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            MRR estimate:{" "}
            <span className="text-gold">
              {data ? `$${data.summary.mrrEstimate}` : "..."}
            </span>
          </p>
          <p className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            Enrollment revenue:{" "}
            <span className="text-gold">
              {data ? `$${data.summary.enrollmentRevenue}` : "..."}
            </span>
          </p>
          <p className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            Canceled:{" "}
            <span className="text-gold">{data?.summary.canceledCount ?? "..."}</span>
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h3 className="text-base font-semibold text-white">Past due members</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {(data?.pastDueMembers ?? []).map((member) => (
              <li
                key={member.membershipId}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                <p className="font-medium text-white">{member.fullName}</p>
                <p className="text-xs text-zinc-500">{member.email}</p>
              </li>
            ))}
            {data && data.pastDueMembers.length === 0 ? (
              <li className="text-zinc-500">No past-due memberships.</li>
            ) : null}
          </ul>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h3 className="text-base font-semibold text-white">Pending enrollments</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {(data?.pendingEnrollments ?? []).map((member) => (
              <li
                key={member.membershipId}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                <p className="font-medium text-white">{member.fullName}</p>
                <p className="text-xs text-zinc-500">
                  {member.email} · {member.enrollmentPaid ? "Paid" : "Unpaid"} ·{" "}
                  {member.status}
                </p>
              </li>
            ))}
            {data && data.pendingEnrollments.length === 0 ? (
              <li className="text-zinc-500">No pending enrollments.</li>
            ) : null}
          </ul>
        </article>
      </section>
    </div>
  );
}
