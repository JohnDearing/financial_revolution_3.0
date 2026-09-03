import { env } from "../config/index.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { isTelegramAccessConfigured } from "./telegram.service.js";

export type PlatformSettingsUpdate = {
  requireEmailVerification?: boolean;
  requireEnrollmentForLearning?: boolean;
  requireActiveMembershipForTelegram?: boolean;
  allowMemberSelfCancel?: boolean;
  revokeTelegramOnCancel?: boolean;
  revokeTelegramOnPastDue?: boolean;
  newSignupsEnabled?: boolean;
  maintenanceMode?: boolean;
  emailWelcomeEnabled?: boolean;
  emailPaymentFailedEnabled?: boolean;
  emailCanceledEnabled?: boolean;
  emailRestoredEnabled?: boolean;
  emailRenewalEnabled?: boolean;
  defaultPlanName?: string;
  enrollmentFeeLabel?: string;
  monthlyPriceLabel?: string;
  supportEmail?: string;
  onboardingWelcomeMessage?: string;
};

const SETTINGS_ID = "default";

function trimText(value: string, field: string, max = 500) {
  const trimmed = value.trim();
  if (!trimmed) throw new HttpError(400, `${field} cannot be empty.`);
  if (trimmed.length > max) {
    throw new HttpError(400, `${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

export async function ensurePlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {},
  });
}

export async function getPlatformSettings() {
  return ensurePlatformSettings();
}

export async function updatePlatformSettings(
  input: PlatformSettingsUpdate,
  updatedByUserId?: string,
) {
  await ensurePlatformSettings();

  const data: PlatformSettingsUpdate & { updatedByUserId?: string } = {
    ...input,
    updatedByUserId,
  };

  if (input.defaultPlanName !== undefined) {
    data.defaultPlanName = trimText(input.defaultPlanName, "Plan name", 120);
  }
  if (input.enrollmentFeeLabel !== undefined) {
    data.enrollmentFeeLabel = trimText(input.enrollmentFeeLabel, "Enrollment fee", 40);
  }
  if (input.monthlyPriceLabel !== undefined) {
    data.monthlyPriceLabel = trimText(input.monthlyPriceLabel, "Monthly price", 40);
  }
  if (input.supportEmail !== undefined) {
    const email = trimText(input.supportEmail, "Support email", 160).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, "Support email looks invalid.");
    }
    data.supportEmail = email;
  }
  if (input.onboardingWelcomeMessage !== undefined) {
    data.onboardingWelcomeMessage = trimText(
      input.onboardingWelcomeMessage,
      "Welcome message",
      1000,
    );
  }

  return prisma.platformSettings.update({
    where: { id: SETTINGS_ID },
    data,
  });
}

export async function getAdminSettingsPayload() {
  const settings = await getPlatformSettings();

  return {
    settings: {
      requireEmailVerification: settings.requireEmailVerification,
      requireEnrollmentForLearning: settings.requireEnrollmentForLearning,
      requireActiveMembershipForTelegram: settings.requireActiveMembershipForTelegram,
      allowMemberSelfCancel: settings.allowMemberSelfCancel,
      revokeTelegramOnCancel: settings.revokeTelegramOnCancel,
      revokeTelegramOnPastDue: settings.revokeTelegramOnPastDue,
      newSignupsEnabled: settings.newSignupsEnabled,
      maintenanceMode: settings.maintenanceMode,
      emailWelcomeEnabled: settings.emailWelcomeEnabled,
      emailPaymentFailedEnabled: settings.emailPaymentFailedEnabled,
      emailCanceledEnabled: settings.emailCanceledEnabled,
      emailRestoredEnabled: settings.emailRestoredEnabled,
      emailRenewalEnabled: settings.emailRenewalEnabled,
      defaultPlanName: settings.defaultPlanName,
      enrollmentFeeLabel: settings.enrollmentFeeLabel,
      monthlyPriceLabel: settings.monthlyPriceLabel,
      supportEmail: settings.supportEmail,
      onboardingWelcomeMessage: settings.onboardingWelcomeMessage,
      updatedAt: settings.updatedAt.toISOString(),
    },
    integrations: {
      stripe: Boolean(env.stripeSecretKey && env.stripeEnrollmentPriceId && env.stripeMonthlyPriceId),
      smtp: Boolean(env.smtpHost && env.smtpUser && env.smtpPass),
      telegram: isTelegramAccessConfigured(),
      cloudinary: Boolean(
        env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret,
      ),
      frontendUrl: env.frontendUrl,
      telegramGroupName: env.telegramGroupName,
      telegramChannelName: env.telegramChannelName,
      telegramBotUsername: env.telegramBotUsername || null,
    },
  };
}
