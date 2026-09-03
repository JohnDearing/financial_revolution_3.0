import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  jwtExpire: process.env.JWT_EXPIRE ?? "15m",
  jwtRefreshExpireDays: Number(process.env.JWT_REFRESH_EXPIRE_DAYS ?? 7),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripeEnrollmentPriceId: process.env.STRIPE_ENROLLMENT_PRICE_ID ?? "",
  stripeMonthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramBotUsername: (process.env.TELEGRAM_BOT_USERNAME ?? "").replace(/^@/, ""),
  telegramGroupChatId: process.env.TELEGRAM_GROUP_CHAT_ID ?? "",
  telegramChannelChatId: process.env.TELEGRAM_CHANNEL_CHAT_ID ?? "",
  telegramGroupInviteLink:
    process.env.TELEGRAM_GROUP_INVITE_LINK ?? "https://t.me/+V_yVJBIXThY5NGMx",
  telegramChannelInviteLink:
    process.env.TELEGRAM_CHANNEL_INVITE_LINK ?? "https://t.me/+HvZ6an0z3QtlNDhh",
  telegramGroupName: process.env.TELEGRAM_GROUP_NAME ?? "F.R. 3.0 Group Chat",
  telegramChannelName:
    process.env.TELEGRAM_CHANNEL_NAME ?? "Forex Revolution 3.0",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
};
