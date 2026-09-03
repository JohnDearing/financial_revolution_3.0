"use client";

import { Film, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ContentItem = {
  id: string;
  title: string;
  type: string;
  track: string | null;
  description?: string | null;
  status: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
  scheduledFor: string | null;
  publishedAt: string | null;
};

type ContentData = {
  summary: { draft: number; scheduled: number; published: number };
  items: ContentItem[];
};

const tracks = [
  "Foundation",
  "Money Zone",
  "Intelligent Diversification",
  "Wealth & Legacy",
];

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function AdminContentClient({
  initialData,
  loadError,
}: {
  initialData: ContentData;
  loadError: string | null;
}) {
  const [data, setData] = useState<ContentData>(initialData);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("recording");
  const [track, setTrack] = useState(tracks[0]);
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">("draft");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const refresh = async () => {
    const response = await fetch("/api/admin/content");
    const result = (await response.json()) as ContentData & { message?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to refresh content.");
      return;
    }
    setData(result);
  };

  const resetForm = () => {
    setTitle("");
    setType("recording");
    setTrack(tracks[0]);
    setStatus("draft");
    setDescription("");
    setScheduledFor("");
    setVideoFile(null);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!videoFile) {
      toast.error("Please choose a video file to upload.");
      return;
    }

    setUploading(true);

    try {
      const signResponse = await fetch("/api/admin/content/sign-upload", {
        method: "POST",
      });
      const signResult = (await signResponse.json()) as {
        message?: string;
        cloudName?: string;
        apiKey?: string;
        timestamp?: number;
        folder?: string;
        signature?: string;
      };

      if (
        !signResponse.ok ||
        !signResult.cloudName ||
        !signResult.apiKey ||
        !signResult.timestamp ||
        !signResult.folder ||
        !signResult.signature
      ) {
        throw new Error(signResult.message ?? "Unable to authorize Cloudinary upload.");
      }

      const cloudinaryForm = new FormData();
      cloudinaryForm.append("file", videoFile);
      cloudinaryForm.append("api_key", signResult.apiKey);
      cloudinaryForm.append("timestamp", String(signResult.timestamp));
      cloudinaryForm.append("folder", signResult.folder);
      cloudinaryForm.append("signature", signResult.signature);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signResult.cloudName}/video/upload`,
        {
          method: "POST",
          body: cloudinaryForm,
        },
      );
      const cloudinaryResult = (await cloudinaryResponse.json()) as {
        error?: { message?: string };
        secure_url?: string;
        public_id?: string;
        duration?: number;
      };

      if (
        !cloudinaryResponse.ok ||
        !cloudinaryResult.secure_url ||
        !cloudinaryResult.public_id
      ) {
        throw new Error(
          cloudinaryResult.error?.message ?? "Cloudinary video upload failed.",
        );
      }

      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          track,
          status,
          description: description.trim(),
          scheduledFor: status === "scheduled" ? scheduledFor : undefined,
          videoUrl: cloudinaryResult.secure_url,
          videoPublicId: cloudinaryResult.public_id,
          thumbnailUrl: `https://res.cloudinary.com/${signResult.cloudName}/video/upload/${cloudinaryResult.public_id}.jpg`,
          durationSec: cloudinaryResult.duration
            ? Math.round(cloudinaryResult.duration)
            : null,
        }),
      });
      const result = (await response.json()) as ContentItem & { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to save content item.");
      }

      toast.success("Video content uploaded successfully.");
      resetForm();
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload content.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!window.confirm("Delete this content item and its Cloudinary video?")) {
      return;
    }
    setDeletingId(contentId);
    const response = await fetch(`/api/admin/content/${contentId}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to delete content.");
      setDeletingId(null);
      return;
    }
    toast.success("Content deleted.");
    setDeletingId(null);
    await refresh();
  };

  return (
    <div className="space-y-5">
      {loadError ? (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {loadError}
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white">Content Operations</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Upload workshop recordings and curriculum videos to Cloudinary for the
          Learning Hub.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            Draft queue: <span className="text-gold">{data.summary.draft}</span>
          </article>
          <article className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            Scheduled: <span className="text-gold">{data.summary.scheduled}</span>
          </article>
          <article className="rounded-xl border border-border bg-background p-3 text-sm text-zinc-300">
            Published: <span className="text-gold">{data.summary.published}</span>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
            <Upload size={16} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">Upload video content</h3>
            <p className="text-xs text-zinc-500">
              MP4 / MOV / WEBM. Uploads go directly to your Cloudinary bucket.
            </p>
          </div>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpload}>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Money Zone Execution Lab Replay"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Type
            </span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
            >
              <option value="recording">Recording</option>
              <option value="workshop">Workshop</option>
              <option value="module">Module</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Track
            </span>
            <select
              value={track}
              onChange={(event) => setTrack(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
            >
              {tracks.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Status
            </span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "draft" | "scheduled" | "published")
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </label>

          {status === "scheduled" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
                Schedule for
              </span>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
              />
            </label>
          ) : (
            <div />
          )}

          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Short summary for members..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Video file
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-zinc-100 file:mr-3 file:rounded-md file:border-0 file:bg-gold/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gold"
            />
            {videoFile ? (
              <p className="mt-2 text-xs text-zinc-500">
                Selected: {videoFile.name} ({Math.round(videoFile.size / (1024 * 1024))} MB)
              </p>
            ) : null}
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-soft disabled:opacity-60"
            >
              <Upload size={15} aria-hidden="true" />
              {uploading ? "Uploading to Cloudinary..." : "Upload content"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <h3 className="text-base font-semibold text-white">Library</h3>
        <div className="mt-4 space-y-2">
          {data.items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-background p-3 text-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
                    <Film size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-xs text-zinc-500">
                      {item.type}
                      {item.track ? ` · ${item.track}` : ""}
                      {formatDuration(item.durationSec)
                        ? ` · ${formatDuration(item.durationSec)}`
                        : ""}
                    </p>
                    {item.videoUrl ? (
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-gold hover:text-gold-soft"
                      >
                        Open Cloudinary video
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-600">No video attached</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex w-fit rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gold">
                    {item.status}
                  </span>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => {
                      void handleDelete(item.id);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {data.items.length === 0 ? (
            <p className="text-sm text-zinc-500">No content items yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
