import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

export async function GET(request: Request) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const backend = await backendAuthFetch(
    `/api/admin/search?q=${encodeURIComponent(q)}`,
  );
  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }
  return NextResponse.json(backend.data);
}
