"use client";

import {
  BookOpen,
  CalendarDays,
  ChartCandlestick,
  Check,
  CirclePlay,
  Clock3,
  Layers3,
  MessageCircle,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PortalStatCard } from "@/components/portal/PortalStatCard";

type TrackStatus = "in-progress" | "available" | "locked" | "completed";

type Recording = {
  id: string;
  title: string;
  duration: string;
  track: string;
  date: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  type: string;
  completed: boolean;
};

type LearningData = {
  summary: {
    completedModules: number;
    totalModules: number;
    percent: number;
    streakDays: number;
    membershipStatus: string;
    enrollmentPaid: boolean;
  };
  continueLearning: {
    moduleId: string;
    contentId: string | null;
    title: string;
    trackId: string;
    trackTitle: string;
    progressPercent: number;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    completed: boolean;
  };
  tracks: Array<{
    id: string;
    title: string;
    focus: string;
    modules: number;
    completed: number;
    status: TrackStatus;
  }>;
  liveSessions: Array<{
    day: string;
    dayLabel?: string;
    title: string;
    time: string;
    timeZones?: string;
    type: string;
    isOff?: boolean;
  }>;
  nextLiveSession: {
    day: string;
    time: string;
    title: string;
    type: string;
    label: string;
    timeZones?: string;
  } | null;
  recordings: Recording[];
  milestones: Array<{ label: string; done: boolean }>;
};

type ActiveVideo = {
  id: string;
  title: string;
  track: string;
  videoUrl: string;
  completed: boolean;
};

const trackIcons: Record<string, LucideIcon> = {
  foundation: BookOpen,
  "money-zone": ChartCandlestick,
  diversification: Layers3,
  wealth: Target,
};

function statusStyles(status: TrackStatus) {
  switch (status) {
    case "in-progress":
      return "border-gold/40 bg-gold/10 text-gold";
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "locked":
      return "border-border bg-background text-zinc-500";
    default:
      return "border-border bg-background text-zinc-300";
  }
}

function statusLabel(status: TrackStatus) {
  switch (status) {
    case "in-progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "locked":
      return "Locked";
    default:
      return "Available";
  }
}

export function MemberLearningHub() {
  const [data, setData] = useState<LearningData | null>(null);
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/member/learning");
      const result = (await response.json()) as LearningData & { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? "Unable to load learning hub.");
        return;
      }
      setData(result);
    };
    void load();
  }, []);

  const openContent = (item: {
    id: string;
    title: string;
    track: string;
    videoUrl: string | null;
    completed: boolean;
  }) => {
    if (!item.videoUrl) {
      toast.error("This module does not have a video yet.");
      return;
    }
    if (data && !data.summary.enrollmentPaid) {
      toast.error("Complete enrollment to unlock learning content.");
      return;
    }
    setActiveVideo({
      id: item.id,
      title: item.title,
      track: item.track,
      videoUrl: item.videoUrl,
      completed: item.completed,
    });
  };

  const markComplete = (contentId: string) => {
    startTransition(async () => {
      const response = await fetch("/api/member/learning/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      const result = (await response.json()) as LearningData & { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? "Unable to update progress.");
        return;
      }
      setData(result);
      setActiveVideo((current) =>
        current && current.id === contentId
          ? { ...current, completed: true }
          : current,
      );
      toast.success("Progress saved.");
    });
  };

  const summary = data?.summary;
  const continueLearning = data?.continueLearning;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard
          icon={BookOpen}
          label="Curriculum progress"
          value={
            summary
              ? `${summary.completedModules} / ${summary.totalModules}`
              : "..."
          }
          helper={
            summary
              ? summary.totalModules > 0
                ? `You are ${summary.percent}% through the member path.`
                : "Published modules will appear here after admin upload."
              : "Loading progress..."
          }
        />
        <PortalStatCard
          icon={CalendarDays}
          label="Next live class"
          value={data?.nextLiveSession?.label ?? "..."}
          helper={
            data?.nextLiveSession?.title ??
            "Join from the schedule below when available."
          }
        />
        <PortalStatCard
          icon={Clock3}
          label="Learning streak"
          value={summary ? `${summary.streakDays} days` : "..."}
          helper="Keep showing up — consistency builds results."
        />
        <PortalStatCard
          icon={Users}
          label="Community"
          value={summary?.enrollmentPaid ? "Active" : "Locked"}
          helper="Private Telegram access unlocks after enrollment."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                Continue learning
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">
                {continueLearning?.title ?? "Loading module..."}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                {continueLearning
                  ? `${continueLearning.trackTitle} · pick up where you left off in your curriculum.`
                  : "Fetching your next recommended module."}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold">
              {summary
                ? `${summary.completedModules} of ${summary.totalModules}`
                : "..."}
            </span>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
              <span>Track progress</span>
              <span>{continueLearning?.progressPercent ?? 0}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${continueLearning?.progressPercent ?? 0}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={!continueLearning?.contentId}
              onClick={() => {
                if (!continueLearning?.contentId) return;
                openContent({
                  id: continueLearning.contentId,
                  title: continueLearning.title,
                  track: continueLearning.trackTitle,
                  videoUrl: continueLearning.videoUrl,
                  completed: continueLearning.completed,
                });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CirclePlay size={16} aria-hidden="true" />
              Resume module
            </button>
            <Link
              href="/member/support"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-gold/40 hover:text-gold"
            >
              Ask mentor for help
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h2 className="text-lg font-semibold text-white">Progress milestones</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Your recommended path through the Financial Revolution curriculum.
          </p>
          <ul className="mt-4 space-y-3">
            {(data?.milestones ?? []).map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-2.5 text-sm text-zinc-300"
              >
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    item.done
                      ? "border-gold/50 bg-gold/15 text-gold"
                      : "border-border bg-background text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  {item.done ? "✓" : ""}
                </span>
                <span className={item.done ? "text-zinc-300" : "text-zinc-500"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white md:text-xl">
          Curriculum tracks
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Structured paths aligned with membership: foundation systems, Money Zone
          execution, diversification, and long-term wealth building.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(data?.tracks ?? []).map((track) => {
            const Icon = trackIcons[track.id] ?? BookOpen;
            const percent =
              track.modules > 0
                ? Math.round((track.completed / track.modules) * 100)
                : 0;
            return (
              <article
                key={track.id}
                className="flex h-full flex-col rounded-xl border border-border bg-background p-4 transition hover:border-gold/35"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyles(track.status)}`}
                  >
                    {statusLabel(track.status)}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {track.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                  {track.focus}
                </p>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {track.completed}/{track.modules} modules
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h2 className="text-lg font-semibold text-white">
            This week&apos;s live classes
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Official weekly schedule — Sunday through Thursday (PST / CST / EST).
          </p>
          <ul className="mt-5 space-y-2.5">
            {(data?.liveSessions ?? []).map((session) => {
              const isOff = Boolean(session.isOff);
              return (
                <li
                  key={`${session.day}-${session.title}-${session.time}`}
                  className={`rounded-xl border p-3 ${
                    isOff
                      ? "border-border/70 bg-background/60"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-12 min-w-12 shrink-0 flex-col items-center justify-center rounded-lg border px-1 ${
                        isOff
                          ? "border-border bg-surface text-zinc-500"
                          : "border-gold/30 bg-gold/10"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          isOff ? "text-zinc-500" : "text-gold"
                        }`}
                      >
                        {session.day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-medium ${
                            isOff ? "text-zinc-500" : "text-white"
                          }`}
                        >
                          {session.title}
                        </p>
                        {!isOff ? (
                          <span className="rounded-md border border-gold/25 bg-gold/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
                            {session.type}
                          </span>
                        ) : null}
                      </div>
                      {!isOff ? (
                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          {session.timeZones || session.time}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-zinc-600">
                          No live session scheduled
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <h2 className="text-lg font-semibold text-white">Workshop replays</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Catch up on recent sessions and reinforce what you learned live.
          </p>
          <ul className="mt-5 space-y-2.5">
            {(data?.recordings ?? []).length === 0 ? (
              <li className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-500">
                No published replays yet. Content uploaded from the admin portal
                will appear here.
              </li>
            ) : (
              (data?.recordings ?? []).map((recording) => (
                <li key={recording.id}>
                  <button
                    type="button"
                    onClick={() =>
                      openContent({
                        id: recording.id,
                        title: recording.title,
                        track: recording.track,
                        videoUrl: recording.videoUrl,
                        completed: recording.completed,
                      })
                    }
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:border-gold/40"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {recording.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {recording.track} · {recording.date} · {recording.duration}
                        {recording.completed ? " · Completed" : ""}
                      </p>
                    </div>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
                      {recording.completed ? (
                        <Check size={15} aria-hidden="true" />
                      ) : (
                        <CirclePlay size={15} aria-hidden="true" />
                      )}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
              <Users size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">1-on-1 mentorship</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Book personal guidance for your financial plan, execution questions,
                or accountability check-ins.
              </p>
              <Link
                href="/member/support"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-soft"
              >
                Request mentorship
              </Link>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
              <MessageCircle size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Private community</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Stay accountable in the protected Telegram community with
                growth-minded members.
              </p>
              <Link
                href="/member/support"
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-gold/40 hover:text-gold"
              >
                Access help
              </Link>
            </div>
          </div>
        </article>
      </section>

      {activeVideo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {activeVideo.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">{activeVideo.track}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-zinc-300 transition hover:border-gold/40 hover:text-gold"
                aria-label="Close video"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-black">
              <video
                key={activeVideo.id}
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="aspect-video w-full"
                onEnded={() => {
                  if (!activeVideo.completed) markComplete(activeVideo.id);
                }}
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                {activeVideo.completed
                  ? "Marked complete in your curriculum progress."
                  : "Watch to the end or mark complete to update your progress."}
              </p>
              <button
                type="button"
                disabled={isPending || activeVideo.completed}
                onClick={() => markComplete(activeVideo.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={15} aria-hidden="true" />
                {activeVideo.completed ? "Completed" : "Mark complete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
