import { SectionTitle } from "./SectionTitle";

const automations = [
  "Stripe webhook updates member status in real time",
  "Telegram invite link is sent after successful payment",
  "Inactive members are removed on cancellation or failed payment",
  "Welcome + confirmation + onboarding emails sent automatically",
  "Admin sees active/inactive status in one dashboard",
];

export function AutomationSection() {
  return (
    <section className="border-b border-border bg-surface py-20">
      <div className="section-shell">
        <SectionTitle
          eyebrow="Automation Layer"
          title="Less manual work. Fewer mistakes. Better retention."
          description="This project is engineered as an operational system, not only a pretty landing page."
        />
        <div className="mt-10 rounded-2xl border border-border bg-black p-8">
          <ul className="space-y-4">
            {automations.map((item) => (
              <li key={item} className="text-sm leading-7 text-zinc-200">
                <span className="mr-3 text-gold">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
