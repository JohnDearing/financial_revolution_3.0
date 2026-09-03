import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/server/backend";
import { hashPassword } from "@/lib/server/password";
import type { PlanId, UserRecord } from "@/lib/server/store";
import { store } from "@/lib/server/store";

export type ResolvedMember = {
  id: string;
  fullName: string;
  email: string;
  role: "member" | "admin";
  isEmailVerified: boolean;
  planId: PlanId;
  subscriptionStatus: UserRecord["subscriptionStatus"];
  cardBrand: string;
  cardLast4: string;
  nextChargeDate: string;
  membershipStatus?: string;
  enrollmentPaid?: boolean;
  source: "backend" | "local";
};

function localMemberByIdOrEmail(userId: string, email: string): UserRecord | null {
  const byId = store.users.get(userId);
  if (byId) return byId;

  const localId = store.usersByEmail.get(email.trim().toLowerCase());
  if (!localId) return null;
  return store.users.get(localId) ?? null;
}

export async function resolveCurrentMember(session: {
  userId: string;
  email: string;
  role: "member" | "admin";
}): Promise<ResolvedMember | null> {
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
        monthlyStartsAt?: string | null;
      };
    }>("/api/members/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (backend.ok) {
      const local = localMemberByIdOrEmail(session.userId, session.email);
      return {
        id: backend.data.user.id,
        fullName: backend.data.user.fullName,
        email: backend.data.user.email,
        role: backend.data.user.role,
        isEmailVerified: true,
        planId: local?.planId ?? "pro",
        subscriptionStatus:
          backend.data.membership?.status === "canceled"
            ? "canceled"
            : backend.data.membership?.status === "past_due"
              ? "past_due"
              : backend.data.membership?.status === "active"
                ? "active"
                : "canceled",
        cardBrand: local?.cardBrand ?? "visa",
        cardLast4: local?.cardLast4 ?? "4242",
        nextChargeDate:
          backend.data.membership?.monthlyStartsAt?.slice(0, 10) ??
          local?.nextChargeDate ??
          "2026-08-02",
        membershipStatus: backend.data.membership?.status,
        enrollmentPaid: backend.data.membership?.enrollmentPaid,
        source: "backend",
      };
    }
  }

  const local = localMemberByIdOrEmail(session.userId, session.email);
  if (!local) return null;

  return {
    id: local.id,
    fullName: local.fullName,
    email: local.email,
    role: local.role,
    isEmailVerified: local.isEmailVerified,
    planId: local.planId,
    subscriptionStatus: local.subscriptionStatus,
    cardBrand: local.cardBrand,
    cardLast4: local.cardLast4,
    nextChargeDate: local.nextChargeDate,
    source: "local",
  };
}

/** Ensures a local billing mirror exists for backend-authenticated members. */
export function ensureLocalMemberMirror(member: ResolvedMember): UserRecord {
  const existing = localMemberByIdOrEmail(member.id, member.email);
  if (existing) {
    existing.fullName = member.fullName;
    existing.isEmailVerified = member.isEmailVerified;
    existing.subscriptionStatus = member.subscriptionStatus;
    store.users.set(existing.id, existing);
    store.usersByEmail.set(existing.email, existing.id);
    return existing;
  }

  const id = randomUUID();
  const record: UserRecord = {
    id,
    fullName: member.fullName,
    email: member.email.trim().toLowerCase(),
    passwordHash: hashPassword(randomUUID()),
    role: "member",
    isEmailVerified: member.isEmailVerified,
    planId: member.planId,
    subscriptionStatus: member.subscriptionStatus,
    cardBrand: member.cardBrand,
    cardLast4: member.cardLast4,
    nextChargeDate: member.nextChargeDate,
    createdAt: new Date().toISOString(),
  };
  store.users.set(id, record);
  store.usersByEmail.set(record.email, id);
  return record;
}
