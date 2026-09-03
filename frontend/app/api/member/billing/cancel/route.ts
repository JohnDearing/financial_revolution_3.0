import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendMemberFetch } from "@/lib/server/memberApi";

export async function POST() {
  const auth = await requireRole("member");
  if ("error" in auth) return auth.error;

  const backend = await backendMemberFetch<{
    message: string;
    membershipStatus: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd?: string;
  }>("/api/members/cancel-subscription", { method: "POST" });

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json(backend.data);
}
