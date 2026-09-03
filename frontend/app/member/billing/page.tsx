import { MemberBillingClient } from "@/components/member/MemberBillingClient";
import { requireRole } from "@/lib/server/guards";
import { backendMemberFetch } from "@/lib/server/memberApi";
import type { MemberBillingSummary } from "@/app/api/member/billing/route";

const emptyBilling: MemberBillingSummary = {
  planName: "Financial Revolution Membership",
  planPrice: "$99",
  enrollmentFee: "$150",
  enrollmentPaid: false,
  membershipStatus: "pending",
  subscriptionStatus: "pending",
  needsEnrollment: true,
  monthlyStartsAt: null,
  nextChargeDate: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeStatus: null,
  cardBrand: "card",
  cardLast4: "----",
  hasStripeCustomer: false,
  hasStripeSubscription: false,
};

const emptyHistory = {
  items: [] as Array<{
    id: string;
    date: string;
    description: string;
    amount: string;
    status: "paid" | "pending" | "failed" | "refunded";
    method: string;
  }>,
  page: 1,
  pageSize: 5,
  total: 0,
  totalPages: 1,
};

export default async function MemberBillingPage() {
  const auth = await requireRole("member");
  if ("error" in auth) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <p className="text-sm text-zinc-400">Please sign in to access billing.</p>
      </section>
    );
  }

  const [billing, history] = await Promise.all([
    backendMemberFetch<MemberBillingSummary>("/api/members/billing"),
    backendMemberFetch<typeof emptyHistory>("/api/members/billing/history?page=1"),
  ]);

  if (!billing.ok) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <p className="text-sm text-zinc-400">
          {billing.message || "Unable to load billing details."}
        </p>
      </section>
    );
  }

  return (
    <MemberBillingClient
      initialBilling={billing.data ?? emptyBilling}
      initialHistory={history.ok ? history.data : emptyHistory}
    />
  );
}
