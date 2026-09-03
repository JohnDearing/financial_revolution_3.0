import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { resolveCurrentMember } from "@/lib/server/memberContext";

export async function GET() {
  const auth = await requireRole("member");
  if ("error" in auth) return auth.error;

  const member = await resolveCurrentMember(auth.session);
  if (!member) {
    return NextResponse.json({ message: "Member not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    planId: member.planId,
    subscriptionStatus: member.subscriptionStatus,
    isEmailVerified: member.isEmailVerified,
    membershipStatus: member.membershipStatus,
    enrollmentPaid: member.enrollmentPaid,
  });
}
