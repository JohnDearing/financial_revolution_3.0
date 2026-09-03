import { SectionTitle } from "./SectionTitle";

const steps = [
  {
    title: "Step 1 - Join & Enroll",
    text: "User signs up and pays the $150 enrollment fee through secure Stripe Checkout.",
  },
  {
    title: "Step 2 - Subscription Activates",
    text: "The $99 monthly recurring subscription starts after the first 30 days.",
  },
  {
    title: "Step 3 - Access is Automated",
    text: "System grants portal + Telegram access and starts the onboarding email flow.",
  },
  {
    title: "Step 4 - Status Sync",
    text: "Webhook updates keep access active for paid members and revoke inactive accounts automatically.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-border bg-surface py-20">
      <div className="section-shell">
        <SectionTitle
          eyebrow="How It Works"
          title="A complete subscription journey built for scale"
          description="From first payment to community access, each step is designed to be reliable and low-maintenance."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-xl border border-border bg-black p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                0{index + 1}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
