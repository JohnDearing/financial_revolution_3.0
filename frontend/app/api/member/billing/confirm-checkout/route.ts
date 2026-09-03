import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

export async function POST(request: Request) {
  const auth = await requireRole("member");
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    sessionId?: string;
    session_id?: string;
  } | null;

  const sessionId = body?.sessionId ?? body?.session_id ?? "";

  const backend = await backendAuthFetch("/api/members/confirm-checkout", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json(backend.data);
}
