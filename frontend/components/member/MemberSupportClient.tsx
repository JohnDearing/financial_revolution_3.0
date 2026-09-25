"use client";

import {
  ExternalLink,
  Link2,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

type CommunityAccess = {
  unlocked: boolean;
  membershipStatus: string;
  enrollmentPaid: boolean;
  telegramConfigured: boolean;
  botConfigured: boolean;
  connectionStatus: string;
  invitationStatus: string;
  telegramUsername: string | null;
  telegramUserId: string | null;
  connectedAt: string | null;
  lastInvitedAt: string | null;
  accessRevokedAt: string | null;
  group: {
    name: string;
    inviteLink: string | null;
    accessActive: boolean;
  };
  channel: {
    name: string;
    inviteLink: string | null;
    accessActive: boolean;
  };
  canConnect: boolean;
  history: Array<{
    action: string;
    target: string | null;
    detail: string | null;
    at: string;
  }>;
};

export function MemberSupportClient() {
  const [community, setCommunity] = useState<CommunityAccess | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    const response = await fetch("/api/member/community");
    const result = (await response.json()) as CommunityAccess & {
      message?: string;
    };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to load Telegram access.");
      return;
    }
    setCommunity(result);
  };

  useEffect(() => {
    void load();
  }, []);

  const connectTelegram = () => {
    startTransition(async () => {
      const response = await fetch("/api/member/telegram/connect", {
        method: "POST",
      });
      const result = (await response.json()) as {
        deepLink?: string;
        message?: string;
      };
      if (!response.ok || !result.deepLink) {
        toast.error(result.message ?? "Unable to start Telegram connect.");
        return;
      }
      window.open(result.deepLink, "_blank", "noopener,noreferrer");
      toast.success("Finish connecting in Telegram, then refresh this page.");
      window.setTimeout(() => {
        void load();
      }, 4000);
    });
  };

  const unlocked = Boolean(community?.unlocked);
  const connected =
    community?.connectionStatus === "connected" ||
    Boolean(community?.telegramUserId);
  const hasInvites = Boolean(
    community?.group.inviteLink && community?.channel.inviteLink,
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white">Support Center</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Submit support requests, access knowledge resources, and contact your
          assigned mentor team.
        </p>
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
          Priority response SLA for active members: within 12 hours.
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
            <MessageCircle size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-white">
              Private Telegram access
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Active paid members get immediate access to both{" "}
              <span className="text-zinc-200">
                {community?.group.name ?? "F.R. 3.0 Group Chat"}
              </span>{" "}
              and{" "}
              <span className="text-zinc-200">
                {community?.channel.name ?? "Forex Revolution 3.0"}
              </span>
              . Use Connect Telegram to securely link your account. Access is
              removed automatically when your paid period ends.
            </p>

            <div className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4">
              {!community ? (
                <p className="text-sm text-zinc-500">Loading Telegram access...</p>
              ) : !unlocked ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Lock size={16} aria-hidden="true" />
                    Locked until enrollment + active membership payment
                  </div>
                  <Link
                    href="/member/billing"
                    className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-gold/40 hover:text-gold"
                  >
                    Complete enrollment
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                      <ShieldCheck size={16} aria-hidden="true" />
                      Membership active
                    </span>
                    {connected ? (
                      <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs text-gold">
                        Telegram linked
                        {community.telegramUsername
                          ? ` @${community.telegramUsername}`
                          : ""}
                      </span>
                    ) : (
                      <span className="rounded-md border border-border px-2 py-0.5 text-xs text-zinc-400">
                        Telegram not connected
                      </span>
                    )}
                  </div>

                  {!connected ? (
                    <button
                      type="button"
                      disabled={!community.canConnect || isPending}
                      onClick={connectTelegram}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Link2 size={16} aria-hidden="true" />
                      {isPending ? "Opening Telegram..." : "Connect Telegram"}
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => void load()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-gold/40 hover:text-gold"
                      >
                        <RefreshCw size={15} aria-hidden="true" />
                        Refresh status
                      </button>
                      {!hasInvites ? (
                        <button
                          type="button"
                          disabled={!community.canConnect || isPending}
                          onClick={connectTelegram}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Link2 size={16} aria-hidden="true" />
                          Reconnect Telegram
                        </button>
                      ) : null}
                    </div>
                  )}

                  {!community.botConfigured ? (
                    <p className="text-xs text-amber-200/90">
                      Bot credentials are not configured on the server yet.
                      Connect Telegram will activate once TELEGRAM_BOT_TOKEN and
                      TELEGRAM_BOT_USERNAME are set.
                    </p>
                  ) : null}

                  {hasInvites ? (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-400">
                        Each link is for you only and does not expire until you join.
                        Do not share them.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <a
                          href={community.group.inviteLink!}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-gold/30 bg-gold/10 p-3 transition hover:border-gold/50"
                        >
                          <p className="text-xs uppercase tracking-[0.12em] text-gold">
                            Group chat
                          </p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {community.group.name}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-300">
                            Join group <ExternalLink size={12} />
                          </p>
                        </a>
                        <a
                          href={community.channel.inviteLink!}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-gold/30 bg-gold/10 p-3 transition hover:border-gold/50"
                        >
                          <p className="text-xs uppercase tracking-[0.12em] text-gold">
                            Channel
                          </p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {community.channel.name}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-300">
                            Join channel <ExternalLink size={12} />
                          </p>
                        </a>
                      </div>
                    </div>
                  ) : connected ? (
                    <p className="text-sm text-zinc-400">
                      Connected. Invites will appear here after access is issued.
                      Tap refresh in a moment.
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400">
                      Tap Connect Telegram, authorize in the bot chat, then return
                      here for both invite links.
                    </p>
                  )}

                  {community.history.length > 0 ? (
                    <div className="border-t border-border pt-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                        Access history
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {community.history.slice(0, 5).map((item) => (
                          <li
                            key={`${item.at}-${item.action}`}
                            className="text-xs text-zinc-500"
                          >
                            {new Date(item.at).toLocaleString()} —{" "}
                            {item.detail ?? item.action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
