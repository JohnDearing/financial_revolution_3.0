import { SectionTitle } from "./SectionTitle";

const phases = [
  "Week 1: Planning, architecture, and setup",
  "Week 2: Landing page and responsive frontend",
  "Week 3: Stripe flow and membership logic",
  "Week 4: Protected portal and content system",
  "Week 5: Telegram and email automation",
  "Week 6: End-to-end QA, launch, and documentation",
];

export function TimelineSection() {
  return (
    <section className="border-b border-border bg-black py-20">
      <div className="section-shell">
        <SectionTitle
          eyebrow="Delivery Plan"
          title="A realistic 5-6 week implementation timeline"
          description="This scope includes payments, secure access, automations, and member operations - quality requires proper sequencing."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {phases.map((phase) => (
            <div
              key={phase}
              className="rounded-lg border border-border bg-surface px-5 py-4 text-sm text-zinc-200"
            >
              {phase}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
