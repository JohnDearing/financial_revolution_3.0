"use client";

import { CircleCheck, Clock3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const steps = [
  "Complete profile details",
  "Select mentorship focus",
  "Set learning schedule",
  "Activate membership with Stripe",
];

export default function MemberSetupPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const primaryGoal = String(formData.get("primaryGoal") ?? "");
    const weeklyCommitment = String(formData.get("weeklyCommitment") ?? "");

    if (!primaryGoal || !weeklyCommitment) {
      toast.error("Please complete member setup fields.");
      return;
    }

    toast.success("Setup saved. Continue to Stripe enrollment.");
    void startCheckout();
  };

  return (
    <main className="min-h-screen bg-black text-foreground">
      <div className="section-shell py-10 md:py-14">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-surface p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">
            Member Setup
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
            Welcome to Financial Revolution 3.0
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Finalize your onboarding, then complete the $150 enrollment fee. Monthly
            billing ($99) starts after 30 days.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr_1fr]">
            <form
              className="space-y-4 rounded-2xl border border-border bg-background p-4"
              onSubmit={handleSubmit}
            >
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Primary financial goal
                </span>
                <select
                  name="primaryGoal"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
                >
                  <option>Debt reduction</option>
                  <option>Cash flow planning</option>
                  <option>Investment fundamentals</option>
                  <option>Legacy strategy</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Weekly learning commitment
                </span>
                <select
                  name="weeklyCommitment"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
                >
                  <option>2 hours / week</option>
                  <option>4 hours / week</option>
                  <option>6+ hours / week</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft disabled:opacity-60"
              >
                {checkoutLoading
                  ? "Opening Stripe Checkout..."
                  : "Complete setup & pay enrollment"}
              </button>
            </form>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="inline-flex items-center gap-2 text-sm text-zinc-300">
                <Clock3 size={16} aria-hidden="true" />
                Estimated time: 3 minutes
              </p>
              <ul className="mt-4 space-y-3">
                {steps.map((step) => (
                  <li key={step} className="inline-flex items-center gap-2 text-sm text-zinc-400">
                    <CircleCheck size={15} className="text-gold" aria-hidden="true" />
                    {step}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => {
                  void startCheckout();
                }}
                className="mt-5 w-full rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/20 disabled:opacity-60"
              >
                {checkoutLoading ? "Redirecting..." : "Pay enrollment now"}
              </button>
              <Link
                href="/member"
                className="mt-3 inline-block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-zinc-200 hover:border-gold/40 hover:text-gold"
              >
                Skip to member dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
