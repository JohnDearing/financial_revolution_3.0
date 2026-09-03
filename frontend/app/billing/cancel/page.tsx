import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-black text-foreground">
      <div className="section-shell flex min-h-screen items-center py-12">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-surface p-8 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Checkout canceled</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">No charge was made</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            You left Stripe Checkout before completing enrollment. You can restart
            payment anytime from billing or onboarding.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/member/billing"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
            >
              Return to billing
            </Link>
            <Link
              href="/onboarding/member-setup"
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm text-zinc-200 hover:border-gold/40 hover:text-gold"
            >
              Back to setup
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
