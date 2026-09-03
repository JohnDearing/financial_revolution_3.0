-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT true,
    "requireEnrollmentForLearning" BOOLEAN NOT NULL DEFAULT true,
    "requireActiveMembershipForTelegram" BOOLEAN NOT NULL DEFAULT true,
    "allowMemberSelfCancel" BOOLEAN NOT NULL DEFAULT true,
    "revokeTelegramOnCancel" BOOLEAN NOT NULL DEFAULT true,
    "revokeTelegramOnPastDue" BOOLEAN NOT NULL DEFAULT false,
    "newSignupsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "emailWelcomeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailPaymentFailedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailCanceledEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailRestoredEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailRenewalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultPlanName" TEXT NOT NULL DEFAULT 'Financial Revolution Membership',
    "enrollmentFeeLabel" TEXT NOT NULL DEFAULT '$150',
    "monthlyPriceLabel" TEXT NOT NULL DEFAULT '$99',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@financialrevolution.com',
    "onboardingWelcomeMessage" TEXT NOT NULL DEFAULT 'Welcome to Financial Revolution 3.0. Verify your email, complete enrollment, then connect Telegram for live community access.',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
