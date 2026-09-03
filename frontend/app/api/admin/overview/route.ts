import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

export async function GET() {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const backend = await backendAuthFetch("/api/admin/overview");
  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }
  return NextResponse.json(backend.data);
}
