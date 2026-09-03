import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { backendFetch } from "@/lib/server/backend";
import { store } from "@/lib/server/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fr3_access_token")?.value;

  if (accessToken) {
    const backend = await backendFetch<{
      user: {
        id: string;
        email: string;
        fullName: string;
        role: "member" | "admin";
      };
      membership?: {
        status: string;
        enrollmentPaid: boolean;
      };
    }>("/api/members/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (backend.ok) {
      return NextResponse.json({
        id: backend.data.user.id,
        fullName: backend.data.user.fullName,
        email: backend.data.user.email,
        role: backend.data.user.role,
        isEmailVerified: true,
        membershipStatus: backend.data.membership?.status,
        enrollmentPaid: backend.data.membership?.enrollmentPaid,
      });
    }
  }

  const localUser = store.users.get(session.userId);
  if (localUser) {
    return NextResponse.json({
      id: localUser.id,
      fullName: localUser.fullName,
      email: localUser.email,
      role: localUser.role,
      isEmailVerified: localUser.isEmailVerified,
      planId: localUser.planId,
      subscriptionStatus: localUser.subscriptionStatus,
    });
  }

  return NextResponse.json({
    id: session.userId,
    fullName: session.email.split("@")[0],
    email: session.email,
    role: session.role,
    isEmailVerified: true,
  });
}
