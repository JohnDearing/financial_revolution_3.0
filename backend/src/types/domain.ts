export type UserRole = "member" | "admin";

export type MembershipStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | "inactive";

export type AppUser = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
};

export type Membership = {
  id: string;
  userId: string;
  status: MembershipStatus;
  enrollmentPaid: boolean;
  monthlyStartsAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
  telegramInvitedAt?: string;
  telegramInviteLink?: string | null;
  canceledAt?: string;
  updatedAt: string;
};
