import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

type AdminMembersPage = {
  members: Array<{
    membershipId: string;
    status: string;
    enrollmentPaid: boolean;
    monthlyStartsAt: string | null;
    planName: string;
    planPrice: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      isEmailVerified: boolean;
    } | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function GET(request: NextRequest) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const pageSize = request.nextUrl.searchParams.get("pageSize") ?? "10";

  const backend = await backendAuthFetch<AdminMembersPage>(
    `/api/admin/members?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
  );

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json({
    members: backend.data.members.map((item) => ({
      id: item.membershipId,
      membershipId: item.membershipId,
      fullName: item.user?.fullName ?? "Unknown",
      email: item.user?.email ?? "",
      isEmailVerified: Boolean(item.user?.isEmailVerified),
      enrollmentPaid: item.enrollmentPaid,
      membershipStatus: item.status,
      planName: item.planName,
      planPrice: item.planPrice,
      subscriptionStatus: item.status,
    })),
    page: backend.data.page,
    pageSize: backend.data.pageSize,
    total: backend.data.total,
    totalPages: backend.data.totalPages,
  });
}
