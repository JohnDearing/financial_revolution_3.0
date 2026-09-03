import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendMemberFetch } from "@/lib/server/memberApi";

export type MemberBillingSummary = {
  planName: string;
  planPrice: string;
  enrollmentFee: string;
  enrollmentPaid: boolean;
  membershipStatus: string;
  subscriptionStatus: string;
  needsEnrollment: boolean;
  monthlyStartsAt: string | null;
  nextChargeDate: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeStatus: string | null;
  cardBrand: string;
  cardLast4: string;
  hasStripeCustomer: boolean;
  hasStripeSubscription: boolean;
};

export async function GET() {
  const auth = await requireRole("member");
  if ("error" in auth) return auth.error;

  const backend = await backendMemberFetch<MemberBillingSummary>("/api/members/billing");
  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json(backend.data);
}
