import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

export type AdminSettingsPayload = {
  settings: {
    requireEmailVerification: boolean;
    requireEnrollmentForLearning: boolean;
    requireActiveMembershipForTelegram: boolean;
    allowMemberSelfCancel: boolean;
    revokeTelegramOnCancel: boolean;
    revokeTelegramOnPastDue: boolean;
    newSignupsEnabled: boolean;
    maintenanceMode: boolean;
    emailWelcomeEnabled: boolean;
    emailPaymentFailedEnabled: boolean;
    emailCanceledEnabled: boolean;
    emailRestoredEnabled: boolean;
    emailRenewalEnabled: boolean;
    defaultPlanName: string;
    enrollmentFeeLabel: string;
    monthlyPriceLabel: string;
    supportEmail: string;
    onboardingWelcomeMessage: string;
    updatedAt: string;
  };
  integrations: {
    stripe: boolean;
    smtp: boolean;
    telegram: boolean;
    cloudinary: boolean;
    frontendUrl: string;
    telegramGroupName: string;
    telegramChannelName: string;
    telegramBotUsername: string | null;
  };
};

export async function GET() {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const backend = await backendAuthFetch<AdminSettingsPayload>("/api/admin/settings");
  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }
  return NextResponse.json(backend.data);
}

export async function PUT(request: Request) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const backend = await backendAuthFetch<AdminSettingsPayload>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }
  return NextResponse.json(backend.data);
}
