"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

type ConfirmResult = {
  membershipStatus?: string;
  enrollmentPaid?: boolean;
  telegram?: {
    groupInviteLink?: string | null;
    channelInviteLink?: string | null;
  };
  message?: string;
};

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [result, setResult] = useState<ConfirmResult | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!sessionId) {
        setStatus("ready");
        return;
      }

      const response = await fetch("/api/member/billing/confirm-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await response.json()) as ConfirmResult;
      if (!response.ok) {
        setStatus("error");
        toast.error(data.message ?? "Unable to finalize enrollment.");
        return;
      }

      setResult(data);
      setStatus("ready");
      toast.success("Enrollment confirmed. Check your email for Telegram access.");
    };

    void run();
  }, [sessionId]);

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-surface p-8 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-gold">Payment confirmed</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Welcome to the membership</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Your $150 enrollment fee is processed. Your $99/month plan continues every 30 days.
        {status === "loading"
          ? " Finalizing your portal access and sending your welcome email..."
          : " A welcome email with your private Telegram group and channel invites is on the way."}
      </p>

      {result?.telegram?.groupInviteLink || result?.telegram?.channelInviteLink ? (
        <div className="mt-6 space-y-2 rounded-xl border border-gold/30 bg-gold/10 p-4 text-left text-sm">
          <p className="font-medium text-gold">Telegram access</p>
          {result.telegram.groupInviteLink ? (
            <a
              href={result.telegram.groupInviteLink}
              target="_blank"
              rel="noreferrer"
              className="block text-zinc-200 underline-offset-2 hover:underline"
            >
              Join F.R. 3.0 Group Chat
            </a>
          ) : null}
          {result.telegram.channelInviteLink ? (
            <a
              href={result.telegram.channelInviteLink}
              target="_blank"
              rel="noreferrer"
              className="block text-zinc-200 underline-offset-2 hover:underline"
            >
              Join Forex Revolution 3.0 Channel
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/member"
          className="inline-flex items-center justify-center rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft"
        >
          Go to member dashboard
        </Link>
        <Link
          href="/member/support"
          className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm text-zinc-200 hover:border-gold/40 hover:text-gold"
        >
          Open Telegram access
        </Link>
      </div>

      {sessionId ? (
        <p className="mt-6 break-all text-xs text-zinc-600">Session: {sessionId}</p>
      ) : null}
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-black text-foreground">
      <div className="section-shell flex min-h-screen items-center py-12">
        <Suspense
          fallback={
            <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-surface p-8 text-center text-sm text-zinc-400">
              Confirming your payment...
            </div>
          }
        >
          <BillingSuccessContent />
        </Suspense>
      </div>
    </main>
  );
}
