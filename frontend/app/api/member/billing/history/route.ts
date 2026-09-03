import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendMemberFetch } from "@/lib/server/memberApi";

type PaymentHistoryPage = {
  items: Array<{
    id: string;
    date: string;
    description: string;
    amount: string;
    status: "paid" | "pending" | "failed" | "refunded";
    method: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function GET(request: NextRequest) {
  const auth = await requireRole("member");
  if ("error" in auth) return auth.error;

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const backend = await backendMemberFetch<PaymentHistoryPage>(
    `/api/members/billing/history?page=${page}`,
  );

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json(backend.data);
}
