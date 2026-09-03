import { AdminContentClient } from "@/components/admin/AdminContentClient";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

type ContentData = {
  summary: { draft: number; scheduled: number; published: number };
  items: Array<{
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
  }>;
};

const emptyData: ContentData = {
  summary: { draft: 0, scheduled: 0, published: 0 },
  items: [],
};

export default async function AdminContentPage() {
  const auth = await requireRole("admin");
  if ("error" in auth) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <p className="text-sm text-zinc-400">Please sign in as admin to manage content.</p>
      </section>
    );
  }

  const backend = await backendAuthFetch<ContentData>("/api/admin/content");

  return (
    <AdminContentClient
      initialData={backend.ok ? backend.data : emptyData}
      loadError={backend.ok ? null : backend.message}
    />
  );
}
