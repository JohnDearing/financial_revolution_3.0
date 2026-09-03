import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import type { UserRole } from "@/lib/server/store";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requireRole(role: UserRole) {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  if (auth.session.role !== role) {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}
