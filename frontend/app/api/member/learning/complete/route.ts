import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

export async function POST(request: Request) {
  const auth = await requireRole("member");
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    contentId?: string;
  } | null;

  const backend = await backendAuthFetch("/api/members/learning/complete", {
    method: "POST",
    body: JSON.stringify({ contentId: body?.contentId ?? "" }),
  });

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json(backend.data);
}
