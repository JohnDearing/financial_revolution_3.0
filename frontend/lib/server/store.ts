import { randomUUID } from "crypto";
import { hashPassword } from "@/lib/server/password";

export type UserRole = "member" | "admin";
export type PlanId = "starter" | "pro" | "elite";

export type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  verificationCode?: string;
  resetCode?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planId: PlanId;
  subscriptionStatus: "active" | "past_due" | "canceled";
  cardLast4: string;
  cardBrand: string;
  nextChargeDate: string;
  createdAt: string;
};

type GlobalStore = {
  users: Map<string, UserRecord>;
  usersByEmail: Map<string, string>;
};

const globalForStore = globalThis as unknown as {
  __financialRevolutionStore?: GlobalStore;
};

const defaultAdminId = randomUUID();
const defaultMemberId = randomUUID();

const defaultStore: GlobalStore = {
  users: new Map([
    [
      defaultAdminId,
      {
        id: defaultAdminId,
        fullName: "Admin User",
        email: "admin@financialrevolution.local",
        passwordHash: hashPassword("Admin@12345"),
        role: "admin",
        isEmailVerified: true,
        planId: "elite",
        subscriptionStatus: "active",
        cardBrand: "visa",
        cardLast4: "4242",
        nextChargeDate: "2026-08-02",
        createdAt: new Date().toISOString(),
      },
    ],
    [
      defaultMemberId,
      {
        id: defaultMemberId,
        fullName: "Member Test Account",
        email: "member@financialrevolution.local",
        passwordHash: hashPassword("Member@12345"),
        role: "member",
        isEmailVerified: true,
        planId: "pro",
        subscriptionStatus: "active",
        cardBrand: "visa",
        cardLast4: "4242",
        nextChargeDate: "2026-08-02",
        createdAt: new Date().toISOString(),
      },
    ],
  ]),
  usersByEmail: new Map([
    ["admin@financialrevolution.local", defaultAdminId],
    ["member@financialrevolution.local", defaultMemberId],
  ]),
};

export const store =
  globalForStore.__financialRevolutionStore ??
  (globalForStore.__financialRevolutionStore = defaultStore);

// Ensure seeded test accounts always exist (hot-reload safe).
if (!store.usersByEmail.has("member@financialrevolution.local")) {
  const memberId = randomUUID();
  store.users.set(memberId, {
    id: memberId,
    fullName: "Member Test Account",
    email: "member@financialrevolution.local",
    passwordHash: hashPassword("Member@12345"),
    role: "member",
    isEmailVerified: true,
    planId: "pro",
    subscriptionStatus: "active",
    cardBrand: "visa",
    cardLast4: "4242",
    nextChargeDate: "2026-08-02",
    createdAt: new Date().toISOString(),
  });
  store.usersByEmail.set("member@financialrevolution.local", memberId);
}

if (!store.usersByEmail.has("admin@financialrevolution.local")) {
  const adminId = randomUUID();
  store.users.set(adminId, {
    id: adminId,
    fullName: "Admin User",
    email: "admin@financialrevolution.local",
    passwordHash: hashPassword("Admin@12345"),
    role: "admin",
    isEmailVerified: true,
    planId: "elite",
    subscriptionStatus: "active",
    cardBrand: "visa",
    cardLast4: "4242",
    nextChargeDate: "2026-08-02",
    createdAt: new Date().toISOString(),
  });
  store.usersByEmail.set("admin@financialrevolution.local", adminId);
}
