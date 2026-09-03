import bcrypt from "bcryptjs";
import type { MembershipStatus, UserRole } from "@prisma/client";
import { env } from "../config/index.js";
import { prisma } from "../lib/prisma.js";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function updateUserById(
  userId: string,
  data: {
    fullName?: string;
    email?: string;
    passwordHash?: string;
    isEmailVerified?: boolean;
    emailVerifiedAt?: Date | null;
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export async function createUserWithMembership(params: {
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
}) {
  return prisma.user.create({
    data: {
      email: params.email,
      fullName: params.fullName,
      passwordHash: params.passwordHash,
      role: params.role,
      isEmailVerified: false,
      memberships: {
        create: {},
      },
    },
  });
}

export async function getMembershipByUserId(userId: string) {
  return prisma.membership.findUnique({ where: { userId } });
}

export async function getUserWithMembership(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: true },
  });
}

export async function listMembershipsWithUsers() {
  return prisma.membership.findMany({
    include: { user: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findMembershipById(membershipId: string) {
  return prisma.membership.findUnique({ where: { id: membershipId } });
}

export async function updateMembershipById(
  membershipId: string,
  data: {
    status?: MembershipStatus;
    enrollmentPaid?: boolean;
    monthlyStartsAt?: Date | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeCheckoutSessionId?: string | null;
    telegramInvitedAt?: Date | null;
    telegramInviteLink?: string | null;
    canceledAt?: Date | null;
  },
) {
  return prisma.membership.update({
    where: { id: membershipId },
    data,
  });
}

async function upsertTestAccount(params: {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  membershipStatus: MembershipStatus;
  enrollmentPaid: boolean;
  monthlyStartsAt?: Date;
}) {
  const passwordHash = bcrypt.hashSync(params.password, 10);

  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      fullName: params.fullName,
      passwordHash,
      role: params.role,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: params.email,
      fullName: params.fullName,
      passwordHash,
      role: params.role,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: { userId: user.id },
    update: {
      status: params.membershipStatus,
      enrollmentPaid: params.enrollmentPaid,
      monthlyStartsAt: params.monthlyStartsAt ?? null,
    },
    create: {
      userId: user.id,
      status: params.membershipStatus,
      enrollmentPaid: params.enrollmentPaid,
      monthlyStartsAt: params.monthlyStartsAt,
    },
  });

  return user;
}

export const seedTestAccounts = async () => {
  const memberEmail = (process.env.TEST_MEMBER_EMAIL ?? "member@financialrevolution.local")
    .trim()
    .toLowerCase();
  const memberPassword = process.env.TEST_MEMBER_PASSWORD ?? "Member@12345";
  const memberName = process.env.TEST_MEMBER_NAME ?? "Member Test Account";

  const adminEmail = (process.env.TEST_ADMIN_EMAIL ?? "admin@financialrevolution.local")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "Admin@12345";
  const adminName = process.env.TEST_ADMIN_NAME ?? "Admin Test Account";

  const member = await upsertTestAccount({
    email: memberEmail,
    fullName: memberName,
    password: memberPassword,
    role: "member",
    membershipStatus: "active",
    enrollmentPaid: true,
    monthlyStartsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  });

  await prisma.user.update({
    where: { id: member.id },
    data: { referralInvites: 4, referralSignups: 2 },
  });

  await prisma.learningProgress.upsert({
    where: { userId: member.id },
    update: {
      completedModuleIds: ["f1", "f2", "f3", "f4", "f5", "m1", "m2"],
      streakDays: 9,
      lastActivityAt: new Date(),
    },
    create: {
      userId: member.id,
      completedModuleIds: ["f1", "f2", "f3", "f4", "f5", "m1", "m2"],
      streakDays: 9,
      lastActivityAt: new Date(),
    },
  });

  await upsertTestAccount({
    email: adminEmail,
    fullName: adminName,
    password: adminPassword,
    role: "admin",
    membershipStatus: "active",
    enrollmentPaid: true,
  });

  const contentSeed = [
    {
      title: "Wealth Building 201",
      type: "module",
      track: "Wealth & Legacy",
      status: "scheduled" as const,
      scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    },
    {
      title: "Money Zone Execution Lab Replay",
      type: "recording",
      track: "Money Zone",
      status: "published" as const,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      title: "Cashflow Clinic Outline",
      type: "workshop",
      track: "Foundation",
      status: "draft" as const,
    },
    {
      title: "Diversification Starter Pack",
      type: "module",
      track: "Intelligent Diversification",
      status: "draft" as const,
    },
  ];

  for (const item of contentSeed) {
    const existing = await prisma.contentItem.findFirst({
      where: { title: item.title },
    });
    if (existing) continue;
    await prisma.contentItem.create({ data: item });
  }

  if (env.nodeEnv !== "production") {
    console.info("Seed accounts ready:");
    console.info(`Member -> ${memberEmail}`);
    console.info(`Admin  -> ${adminEmail}`);
    console.info(`Member user id -> ${member.id}`);
  }
};
