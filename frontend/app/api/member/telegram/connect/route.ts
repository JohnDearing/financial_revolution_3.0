import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

export async function POST() {
  const auth = await requireRole("member");
  if ("error" in auth) return auth.error;

  const backend = await backendAuthFetch("/api/members/telegram/connect", {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }
  return NextResponse.json(backend.data);
}
