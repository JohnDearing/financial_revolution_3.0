import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendMemberFetch } from "@/lib/server/memberApi";

export async function POST() {
  const auth = await requireRole("member");
  if ("error" in auth) return auth.error;

  const backend = await backendMemberFetch<{ portalUrl: string }>(
    "/api/members/billing-portal",
    { method: "POST" },
  );

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json(backend.data);
}
