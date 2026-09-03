import { type LucideIcon } from "lucide-react";

type PortalStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
};

export function PortalStatCard({
  icon: Icon,
  label,
  value,
  helper,
}: PortalStatCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{helper}</p>
    </article>
  );
}
