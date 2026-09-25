import { env } from "../config/index.js";

type EmailCta = {
  label: string;
  href: string;
};

type EmailTemplateInput = {
  preheader?: string;
  eyebrow?: string;
  title: string;
  greeting?: string;
  intro: string;
  bodyHtml?: string;
  details?: Array<{ label: string; value: string }>;
  cta?: EmailCta;
  secondaryCta?: EmailCta;
  footerNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderEmailLayout(input: EmailTemplateInput) {
  const detailsHtml =
    input.details && input.details.length > 0
      ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-collapse:collapse;">
        ${input.details
          .map(
            (row) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#a1a1aa;font-size:13px;width:40%;">${escapeHtml(row.label)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#fafafa;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(row.value)}</td>
          </tr>`,
          )
          .join("")}
      </table>`
      : "";

  const ctaHtml = input.cta
    ? `
      <a href="${escapeHtml(input.cta.href)}" style="display:inline-block;margin-top:8px;background:#c9a227;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:14px;padding:14px 22px;border-radius:10px;">
        ${escapeHtml(input.cta.label)}
      </a>`
    : "";

  const secondaryCtaHtml = input.secondaryCta
    ? `
      <a href="${escapeHtml(input.secondaryCta.href)}" style="display:inline-block;margin:16px 0 0 12px;color:#c9a227;text-decoration:none;font-weight:600;font-size:13px;">
        ${escapeHtml(input.secondaryCta.label)}
      </a>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;color:#fafafa;font-family:Georgia,'Times New Roman',serif;">
    ${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#141414;border:1px solid #2a2a2a;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px;border-bottom:1px solid #2a2a2a;">
                <p style="margin:0;color:#c9a227;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Financial Revolution 3.0</p>
                ${input.eyebrow ? `<p style="margin:10px 0 0;color:#a1a1aa;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;color:#fafafa;font-weight:700;">${escapeHtml(input.title)}</h1>
                ${input.greeting ? `<p style="margin:0 0 12px;color:#e4e4e7;font-size:15px;line-height:1.7;">${escapeHtml(input.greeting)}</p>` : ""}
                <p style="margin:0;color:#d4d4d8;font-size:15px;line-height:1.7;">${escapeHtml(input.intro)}</p>
                ${detailsHtml}
                ${input.bodyHtml ?? ""}
                <div style="margin-top:28px;">
                  ${ctaHtml}
                  ${secondaryCtaHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid #2a2a2a;background:#101010;">
                <p style="margin:0;color:#71717a;font-size:12px;line-height:1.6;">
                  ${escapeHtml(input.footerNote ?? "You’re receiving this because you have a Financial Revolution 3.0 account.")}
                </p>
                <p style="margin:10px 0 0;color:#52525b;font-size:12px;">
                  <a href="${escapeHtml(env.frontendUrl)}" style="color:#c9a227;text-decoration:none;">${escapeHtml(env.frontendUrl.replace(/^https?:\/\//, ""))}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function verificationEmailTemplate(params: {
  fullName: string;
  code: string;
  expiresAt: Date;
}) {
  return {
    subject: "Verify your Financial Revolution 3.0 account",
    html: renderEmailLayout({
      preheader: `Your verification code is ${params.code}`,
      eyebrow: "Account security",
      title: "Verify your email",
      greeting: `Hi ${params.fullName},`,
      intro:
        "Enter this code to confirm your email and unlock your member workspace.",
      details: [
        { label: "Verification code", value: params.code },
        {
          label: "Expires",
          value: params.expiresAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
      ],
      cta: {
        label: "Verify email",
        href: `${env.frontendUrl}/auth/verify-email`,
      },
      footerNote: "If you did not create this account, you can ignore this email.",
    }),
  };
}

export function passwordResetEmailTemplate(params: {
  fullName: string;
  code: string;
  expiresAt: Date;
}) {
  return {
    subject: "Reset your Financial Revolution 3.0 password",
    html: renderEmailLayout({
      preheader: `Your password reset code is ${params.code}`,
      eyebrow: "Account security",
      title: "Reset your password",
      greeting: `Hi ${params.fullName},`,
      intro:
        "Use this one-time code to create a new password for your member account.",
      details: [
        { label: "Reset code", value: params.code },
        {
          label: "Expires",
          value: params.expiresAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
      ],
      cta: {
        label: "Reset password",
        href: `${env.frontendUrl}/auth/forgot-password`,
      },
      footerNote:
        "If you did not request a password reset, you can safely ignore this email.",
    }),
  };
}

export function membershipWelcomeEmailTemplate(params: {
  fullName: string;
  planName: string;
  enrollmentFee: string;
  monthlyPrice: string;
  monthlyStartsAt: string;
  groupName: string;
  channelName: string;
  groupInviteLink?: string | null;
  channelInviteLink?: string | null;
  awaitingConnection?: boolean;
}) {
  const hasInvites = Boolean(params.groupInviteLink && params.channelInviteLink);
  const telegramBlock = hasInvites
    ? `
      <div style="margin:24px 0;padding:18px;border:1px solid #3f3a1f;border-radius:12px;background:#1a170c;">
        <p style="margin:0 0 8px;color:#c9a227;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">Private Telegram access</p>
        <p style="margin:0 0 12px;color:#e4e4e7;font-size:14px;line-height:1.7;">
          Your paid membership unlocks both communities immediately. Each link is for you only and does not expire until you join. Do not share them.
        </p>
        <p style="margin:0;color:#fafafa;font-size:14px;line-height:1.7;">
          <strong>${escapeHtml(params.groupName)}</strong><br/>
          <a href="${escapeHtml(params.groupInviteLink!)}" style="color:#c9a227;">${escapeHtml(params.groupInviteLink!)}</a>
        </p>
        <p style="margin:14px 0 0;color:#fafafa;font-size:14px;line-height:1.7;">
          <strong>${escapeHtml(params.channelName)}</strong><br/>
          <a href="${escapeHtml(params.channelInviteLink!)}" style="color:#c9a227;">${escapeHtml(params.channelInviteLink!)}</a>
        </p>
      </div>`
    : `
      <div style="margin:24px 0;padding:18px;border:1px solid #3f3a1f;border-radius:12px;background:#1a170c;">
        <p style="margin:0 0 8px;color:#c9a227;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">Private Telegram access</p>
        <p style="margin:0;color:#e4e4e7;font-size:14px;line-height:1.7;">
          Access to <strong style="color:#fafafa;">${escapeHtml(params.groupName)}</strong> and
          <strong style="color:#fafafa;">${escapeHtml(params.channelName)}</strong> is included with your membership.
          Open Support in the member portal and tap <strong style="color:#fafafa;">Connect Telegram</strong> to securely link your account and receive both invites.
        </p>
      </div>`;

  return {
    subject: "Welcome to Financial Revolution 3.0 — payment confirmed",
    html: renderEmailLayout({
      preheader: "Payment confirmed. Connect Telegram for private group + channel access.",
      eyebrow: "Membership confirmed",
      title: "You’re in. Let’s build.",
      greeting: `Hi ${params.fullName},`,
      intro:
        "Your enrollment payment was successful and your Financial Revolution membership is now active. Telegram access is for active paid members only — no trial.",
      details: [
        { label: "Plan", value: params.planName },
        { label: "Enrollment", value: params.enrollmentFee },
        { label: "Monthly membership", value: `${params.monthlyPrice} / month` },
        { label: "Next monthly charge", value: params.monthlyStartsAt },
      ],
      bodyHtml: `
        ${telegramBlock}
        <p style="margin:0;color:#d4d4d8;font-size:15px;line-height:1.7;">
          Next steps: open your member portal, resume the Learning Hub, and connect Telegram for private community access.
        </p>`,
      cta: {
        label: hasInvites ? "Open member portal" : "Connect Telegram",
        href: hasInvites
          ? `${env.frontendUrl}/member`
          : `${env.frontendUrl}/member/support`,
      },
      secondaryCta: {
        label: "View billing",
        href: `${env.frontendUrl}/member/billing`,
      },
      footerNote:
        "Keep this email for your records. You can manage billing anytime from your member portal.",
    }),
  };
}

export function telegramInviteEmailTemplate(params: {
  fullName: string;
  groupName: string;
  channelName: string;
  groupInviteLink: string;
  channelInviteLink: string;
}) {
  return {
    subject: "Your Financial Revolution Telegram invites are ready",
    html: renderEmailLayout({
      preheader: "Join the private group chat and channel — paid members only.",
      eyebrow: "Community access",
      title: "Your Telegram invites are ready",
      greeting: `Hi ${params.fullName},`,
      intro:
        "Your Telegram account is connected. Use the secure invites below to join both communities. Each link admits one person and does not expire until you join. Do not share them.",
      details: [
        { label: "Group chat", value: params.groupName },
        { label: "Channel", value: params.channelName },
        { label: "Access", value: "Active paid members only" },
      ],
      bodyHtml: `
        <div style="margin:20px 0;padding:16px;border:1px solid #2a2a2a;border-radius:12px;background:#111;">
          <p style="margin:0 0 8px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Group chat</p>
          <p style="margin:0;"><a href="${escapeHtml(params.groupInviteLink)}" style="color:#c9a227;font-size:14px;">${escapeHtml(params.groupInviteLink)}</a></p>
          <p style="margin:16px 0 8px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Channel</p>
          <p style="margin:0;"><a href="${escapeHtml(params.channelInviteLink)}" style="color:#c9a227;font-size:14px;">${escapeHtml(params.channelInviteLink)}</a></p>
        </div>`,
      cta: {
        label: "Open Support page",
        href: `${env.frontendUrl}/member/support`,
      },
      footerNote:
        "Access is removed automatically when your paid billing period ends or if your membership is deactivated.",
    }),
  };
}

export function paymentFailedEmailTemplate(params: {
  fullName: string;
  planName: string;
}) {
  return {
    subject: "Action needed: membership payment failed",
    html: renderEmailLayout({
      preheader: "Update your payment method to keep access active.",
      eyebrow: "Billing alert",
      title: "We couldn’t process your payment",
      greeting: `Hi ${params.fullName},`,
      intro: `Your latest charge for ${params.planName} failed. Update your card to avoid interruption to Learning Hub and community access.`,
      cta: {
        label: "Update billing",
        href: `${env.frontendUrl}/member/billing`,
      },
      footerNote:
        "If you recently updated your card, it can take a short time for Stripe to retry the charge.",
    }),
  };
}

export function membershipCanceledEmailTemplate(params: {
  fullName: string;
  endsOn?: string | null;
}) {
  return {
    subject: "Your Financial Revolution membership was canceled",
    html: renderEmailLayout({
      preheader: "We’re sorry to see you go — your cancellation is confirmed.",
      eyebrow: "Membership update",
      title: "Cancellation confirmed",
      greeting: `Hi ${params.fullName},`,
      intro:
        "Your membership cancellation is confirmed. Premium Learning Hub and private Telegram access will no longer remain active.",
      details: params.endsOn
        ? [{ label: "Access through", value: params.endsOn }]
        : undefined,
      cta: {
        label: "Rejoin membership",
        href: `${env.frontendUrl}/member/billing`,
      },
      footerNote:
        "If this was a mistake, you can restart enrollment from your billing page.",
    }),
  };
}

export function membershipRestoredEmailTemplate(params: {
  fullName: string;
  groupInviteLink?: string | null;
  channelInviteLink?: string | null;
  awaitingConnection?: boolean;
}) {
  const hasInvites = Boolean(params.groupInviteLink && params.channelInviteLink);
  return {
    subject: "Your Financial Revolution access is restored",
    html: renderEmailLayout({
      preheader: "Payment received — membership and Telegram access restored.",
      eyebrow: "Membership restored",
      title: "Welcome back",
      greeting: `Hi ${params.fullName},`,
      intro: hasInvites
        ? "We received your payment and restored portal access plus your private Telegram group and channel invites."
        : "We received your payment and restored your membership. Connect Telegram again in Support to reopen private community access.",
      bodyHtml: hasInvites
        ? `
        <div style="margin:20px 0;padding:16px;border:1px solid #2a2a2a;border-radius:12px;background:#111;">
          <p style="margin:0 0 8px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Group chat</p>
          <p style="margin:0;"><a href="${escapeHtml(params.groupInviteLink!)}" style="color:#c9a227;font-size:14px;">${escapeHtml(params.groupInviteLink!)}</a></p>
          <p style="margin:16px 0 8px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Channel</p>
          <p style="margin:0;"><a href="${escapeHtml(params.channelInviteLink!)}" style="color:#c9a227;font-size:14px;">${escapeHtml(params.channelInviteLink!)}</a></p>
        </div>`
        : undefined,
      cta: {
        label: hasInvites ? "Open member portal" : "Connect Telegram",
        href: hasInvites
          ? `${env.frontendUrl}/member`
          : `${env.frontendUrl}/member/support`,
      },
    }),
  };
}

export function subscriptionRenewalEmailTemplate(params: {
  fullName: string;
  amount: string;
  invoiceDate: string;
}) {
  return {
    subject: "Payment received — membership renewed",
    html: renderEmailLayout({
      preheader: `We received your ${params.amount} membership payment.`,
      eyebrow: "Billing receipt",
      title: "Thanks — your membership is renewed",
      greeting: `Hi ${params.fullName},`,
      intro:
        "Your recurring membership payment was successful. Access to the Learning Hub and private community remains active.",
      details: [
        { label: "Amount paid", value: params.amount },
        { label: "Invoice date", value: params.invoiceDate },
      ],
      cta: {
        label: "View billing history",
        href: `${env.frontendUrl}/member/billing`,
      },
    }),
  };
}
