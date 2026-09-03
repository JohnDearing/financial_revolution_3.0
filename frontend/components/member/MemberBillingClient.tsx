"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MemberBillingSummary } from "@/app/api/member/billing/route";

type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

type PaymentHistoryItem = {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: PaymentStatus;
  method: string;
};

type PaymentHistoryResponse = {
  items: PaymentHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  message?: string;
};

const pricingPlans = [
  {
    id: "enrollment",
    label: "Enrollment",
    helper: "$150 one-time",
    detail: "Required to unlock membership access.",
  },
  {
    id: "membership",
    label: "Membership",
    helper: "$99 / month",
    detail: "Starts 30 days after enrollment.",
  },
] as const;

function statusStyles(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "pending":
      return "border-gold/40 bg-gold/10 text-gold";
    case "failed":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "refunded":
      return "border-border bg-surface text-zinc-300";
    default:
      return "border-border bg-background text-zinc-300";
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MemberBillingClient({
  initialBilling,
  initialHistory,
}: {
  initialBilling: MemberBillingSummary;
  initialHistory: PaymentHistoryResponse;
}) {
  const [billing, setBilling] = useState(initialBilling);
  const [historyPage, setHistoryPage] = useState(initialHistory.page);
  const [history, setHistory] = useState<PaymentHistoryResponse>(initialHistory);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const refreshBilling = async () => {
    const response = await fetch("/api/member/billing");
    const result = (await response.json()) as MemberBillingSummary & { message?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to load billing.");
      return null;
    }
    setBilling(result);
    return result;
  };

  const loadHistory = async (page: number) => {
    if (page === historyPage && history.page === page) return;
    setHistoryLoading(true);
    const response = await fetch(`/api/member/billing/history?page=${page}`);
    const result = (await response.json()) as PaymentHistoryResponse;
    if (!response.ok) {
      toast.error(result.message ?? "Unable to load payment history.");
      setHistoryLoading(false);
      return;
    }
    setHistory(result);
    setHistoryPage(result.page);
    setHistoryLoading(false);
  };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    const response = await fetch("/api/member/billing/checkout", { method: "POST" });
    const result = (await response.json()) as {
      checkoutUrl?: string;
      message?: string;
    };
    if (!response.ok || !result.checkoutUrl) {
      toast.error(result.message ?? "Unable to start Stripe checkout.");
      setCheckoutLoading(false);
      return;
    }
    window.location.href = result.checkoutUrl;
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    const response = await fetch("/api/member/billing/portal", { method: "POST" });
    const result = (await response.json()) as { portalUrl?: string; message?: string };
    if (!response.ok || !result.portalUrl) {
      toast.error(result.message ?? "Unable to open Stripe billing portal.");
      setPortalLoading(false);
      return;
    }
    window.location.href = result.portalUrl;
  };

  const cancelPlan = async () => {
    if (
      !window.confirm(
        "Cancel your membership at the end of the current billing period?",
      )
    ) {
      return;
    }

    setCancelLoading(true);
    const response = await fetch("/api/member/billing/cancel", { method: "POST" });
    const result = (await response.json()) as {
      message?: string;
      currentPeriodEnd?: string;
    };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to cancel subscription.");
      setCancelLoading(false);
      return;
    }

    toast.success(result.message ?? "Cancellation scheduled.");
    await refreshBilling();
    setCancelLoading(false);
  };

  const totalPages = history.totalPages;
  const canGoPrev = historyPage > 1 && !historyLoading;
  const canGoNext = historyPage < totalPages && !historyLoading;
  const rangeStart =
    (history.page - 1) * history.pageSize + (history.items.length ? 1 : 0);
  const rangeEnd = (history.page - 1) * history.pageSize + history.items.length;
  const isActiveMembership =
    billing.membershipStatus === "active" || billing.membershipStatus === "past_due";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white">Billing & Subscription</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Financial Revolution membership uses two charges only: a one-time enrollment
          fee and a monthly membership.
        </p>

        {billing.needsEnrollment ? (
          <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-4">
            <p className="text-sm font-medium text-gold">
              {billing.enrollmentPaid ? "Reactivate membership" : "Enrollment required"}
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {billing.enrollmentPaid
                ? "Restart your $99/month membership securely with Stripe Checkout."
                : "Pay the $150 enrollment fee now. Your $99/month membership begins after 30 days."}
            </p>
            <button
              type="button"
              disabled={checkoutLoading}
              onClick={() => {
                void startCheckout();
              }}
              className="mt-3 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft disabled:opacity-60"
            >
              {checkoutLoading
                ? "Redirecting to Stripe..."
                : billing.enrollmentPaid
                  ? "Reactivate with Stripe"
                  : "Enroll with Stripe"}
            </button>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-4 text-sm text-zinc-300">
            <p>
              Current plan:{" "}
              <span className="font-semibold text-gold">
                {billing.planName} ({billing.planPrice}/month)
              </span>
            </p>
            <p className="mt-2">
              Status:{" "}
              <span className="uppercase">{billing.membershipStatus}</span>
              {billing.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
            </p>
            <p className="mt-2">
              Enrollment: {billing.enrollmentPaid ? "Paid ($150)" : "Not paid"}
            </p>
            <p className="mt-2">
              Next charge: {formatDate(billing.nextChargeDate)}
            </p>
            <p className="mt-2">
              Card on file: {billing.cardBrand.toUpperCase()} **** {billing.cardLast4}
            </p>
            <button
              type="button"
              disabled={portalLoading || !billing.hasStripeCustomer}
              onClick={() => {
                void openBillingPortal();
              }}
              className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-zinc-200 hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {portalLoading ? "Opening Stripe..." : "Update card in Stripe"}
            </button>
          </article>

          <article className="rounded-xl border border-border bg-background p-4 text-sm">
            <p className="font-medium text-white">Membership pricing</p>
            <p className="mt-1 text-xs text-zinc-500">
              These are your only two plan charges — not switchable tiers.
            </p>
            <div className="mt-3 space-y-2">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-lg border border-border px-3 py-2 text-zinc-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{plan.label}</span>
                    <span className="text-zinc-400">{plan.helper}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{plan.detail}</p>
                </div>
              ))}
            </div>

            {isActiveMembership && !billing.cancelAtPeriodEnd ? (
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => {
                  void cancelPlan();
                }}
                className="mt-4 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-60"
              >
                {cancelLoading ? "Canceling..." : "Cancel subscription"}
              </button>
            ) : null}

            {billing.cancelAtPeriodEnd ? (
              <p className="mt-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-zinc-400">
                Cancellation scheduled
                {billing.currentPeriodEnd
                  ? ` for ${formatDate(billing.currentPeriodEnd)}`
                  : ""}
                . Access remains active until then.
              </p>
            ) : null}
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Payment history</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Invoices synced from Stripe for your membership account.
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Showing {rangeStart}-{rangeEnd} of {history.total}
          </p>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-[640px] w-full border-collapse text-left text-sm">
            <thead className="bg-background">
              <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-zinc-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className={`bg-surface ${historyLoading ? "opacity-60" : ""}`}>
              {history.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No Stripe invoices yet. Complete enrollment to see payments here.
                  </td>
                </tr>
              ) : null}

              {history.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-b-0 hover:bg-background/70"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                    {formatDate(item.date)}
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{item.description}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {item.method}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                    {item.amount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyles(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Page {historyPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => {
                void loadHistory(historyPage - 1);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-zinc-200 transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-zinc-200"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                const isActive = page === historyPage;
                return (
                  <button
                    key={page}
                    type="button"
                    disabled={historyLoading}
                    onClick={() => {
                      void loadHistory(page);
                    }}
                    className={`h-9 min-w-9 rounded-lg border px-2 text-sm transition ${
                      isActive
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-border text-zinc-300 hover:border-gold/40 hover:text-gold"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => {
                void loadHistory(historyPage + 1);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-zinc-200 transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-zinc-200"
            >
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
