"use client";

import {
  Bell,
  Cable,
  LoaderCircle,
  Save,
  Shield,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminSettingsPayload } from "@/app/api/admin/settings/route";

type SettingsState = AdminSettingsPayload["settings"];

type ToggleKey = {
  [K in keyof SettingsState]: SettingsState[K] extends boolean ? K : never;
}[keyof SettingsState];

const ACCESS_TOGGLES: Array<{ key: ToggleKey; label: string; hint: string }> = [
  {
    key: "requireEmailVerification",
    label: "Require email verification",
    hint: "Members must verify email before signing in.",
  },
  {
    key: "requireEnrollmentForLearning",
    label: "Lock Learning Hub until enrollment",
    hint: "Tracks stay locked until the enrollment fee is paid.",
  },
  {
    key: "requireActiveMembershipForTelegram",
    label: "Telegram requires active membership",
    hint: "Only active paid members can connect and receive invites.",
  },
  {
    key: "allowMemberSelfCancel",
    label: "Allow member self-cancel",
    hint: "Members can cancel from Billing. Disable to force support-assisted cancel.",
  },
  {
    key: "revokeTelegramOnCancel",
    label: "Revoke Telegram on cancel",
    hint: "Kick members from group/channel when membership is canceled.",
  },
  {
    key: "revokeTelegramOnPastDue",
    label: "Revoke Telegram on past due",
    hint: "Remove Telegram access immediately when payment fails.",
  },
  {
    key: "newSignupsEnabled",
    label: "Allow new member signups",
    hint: "Turn off to pause public registration.",
  },
  {
    key: "maintenanceMode",
    label: "Maintenance mode",
    hint: "Blocks member login and registration while admins keep access.",
  },
];

const EMAIL_TOGGLES: Array<{ key: ToggleKey; label: string; hint: string }> = [
  {
    key: "emailWelcomeEnabled",
    label: "Welcome / enrollment email",
    hint: "Sent after successful checkout with Telegram invite context.",
  },
  {
    key: "emailPaymentFailedEnabled",
    label: "Payment failed email",
    hint: "Sent when a subscription becomes past due.",
  },
  {
    key: "emailCanceledEnabled",
    label: "Cancellation email",
    hint: "Sent when membership is canceled or marked inactive.",
  },
  {
    key: "emailRestoredEnabled",
    label: "Access restored email",
    hint: "Sent when a past-due or canceled member becomes active again.",
  },
  {
    key: "emailRenewalEnabled",
    label: "Renewal receipt email",
    hint: "Sent after successful monthly invoice payments.",
  },
];

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background px-3 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-1 block text-xs text-zinc-500">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-gold" : "bg-zinc-700"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-black transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-sm font-medium ${ok ? "text-gold" : "text-zinc-400"}`}>
        {ok ? "Connected" : "Not configured"}
      </p>
    </div>
  );
}

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [integrations, setIntegrations] = useState<
    AdminSettingsPayload["integrations"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/settings");
    const result = (await response.json()) as AdminSettingsPayload & {
      message?: string;
    };
    if (!response.ok) {
      toast.error(result.message ?? "Unable to load settings.");
      setLoading(false);
      return;
    }
    setSettings(result.settings);
    setIntegrations(result.integrations);
    setDirty(false);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateToggle = (key: ToggleKey, value: boolean) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
  };

  const updateText = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = (await response.json()) as AdminSettingsPayload & {
        message?: string;
      };
      if (!response.ok) {
        toast.error(result.message ?? "Unable to save settings.");
        return;
      }
      setSettings(result.settings);
      setIntegrations(result.integrations);
      setDirty(false);
      toast.success("Platform settings saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings || !integrations) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-zinc-500">
        <LoaderCircle className="mx-auto mb-3 animate-spin text-gold" size={20} />
        Loading platform settings...
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Platform Settings</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Configure access policies, notification templates, and onboarding
              defaults.
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Last updated{" "}
              {new Date(settings.updatedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {dirty ? " · Unsaved changes" : ""}
            </p>
          </div>
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => {
              void save();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={16} className="text-gold" />
          <h3 className="text-base font-semibold text-white">Access policies</h3>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {ACCESS_TOGGLES.map((item) => (
            <ToggleRow
              key={item.key}
              label={item.label}
              hint={item.hint}
              checked={settings[item.key]}
              disabled={saving}
              onChange={(value) => updateToggle(item.key, value)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={16} className="text-gold" />
          <h3 className="text-base font-semibold text-white">
            Lifecycle email notifications
          </h3>
        </div>
        <p className="mb-4 text-sm text-zinc-400">
          Control which automated member emails are sent. Templates stay branded;
          these switches only enable or disable delivery.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {EMAIL_TOGGLES.map((item) => (
            <ToggleRow
              key={item.key}
              label={item.label}
              hint={item.hint}
              checked={settings[item.key]}
              disabled={saving}
              onChange={(value) => updateToggle(item.key, value)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          <h3 className="text-base font-semibold text-white">Onboarding defaults</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Plan name
            </span>
            <input
              value={settings.defaultPlanName}
              disabled={saving}
              onChange={(event) => updateText("defaultPlanName", event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/40"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Support email
            </span>
            <input
              type="email"
              value={settings.supportEmail}
              disabled={saving}
              onChange={(event) => updateText("supportEmail", event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/40"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Enrollment fee label
            </span>
            <input
              value={settings.enrollmentFeeLabel}
              disabled={saving}
              onChange={(event) =>
                updateText("enrollmentFeeLabel", event.target.value)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/40"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Monthly price label
            </span>
            <input
              value={settings.monthlyPriceLabel}
              disabled={saving}
              onChange={(event) =>
                updateText("monthlyPriceLabel", event.target.value)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/40"
            />
          </label>
          <label className="block space-y-2 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Welcome message
            </span>
            <textarea
              rows={4}
              value={settings.onboardingWelcomeMessage}
              disabled={saving}
              onChange={(event) =>
                updateText("onboardingWelcomeMessage", event.target.value)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/40"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Cable size={16} className="text-gold" />
          <h3 className="text-base font-semibold text-white">Integration health</h3>
        </div>
        <p className="mb-4 text-sm text-zinc-400">
          Read-only status from environment configuration. Secrets stay in server
          env — update them there, not in this UI.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusPill ok={integrations.stripe} label="Stripe" />
          <StatusPill ok={integrations.smtp} label="Email / SMTP" />
          <StatusPill ok={integrations.telegram} label="Telegram" />
          <StatusPill ok={integrations.cloudinary} label="Cloudinary" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <p className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-zinc-300">
            Frontend URL:{" "}
            <span className="text-zinc-100">{integrations.frontendUrl}</span>
          </p>
          <p className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-zinc-300">
            Telegram bot:{" "}
            <span className="text-zinc-100">
              {integrations.telegramBotUsername
                ? `@${integrations.telegramBotUsername}`
                : "Not set"}
            </span>
          </p>
          <p className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-zinc-300">
            Group:{" "}
            <span className="text-zinc-100">{integrations.telegramGroupName}</span>
          </p>
          <p className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-zinc-300">
            Channel:{" "}
            <span className="text-zinc-100">{integrations.telegramChannelName}</span>
          </p>
        </div>
      </section>
    </div>
  );
}
