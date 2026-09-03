import { SectionTitle } from "./SectionTitle";

const pillars = [
  {
    title: "Live Weekly Sessions",
    text: "Members get practical coaching and deep-dive classes focused on implementation, not theory only.",
  },
  {
    title: "Private Community",
    text: "A serious network of growth-minded members in a protected Telegram community with accountability.",
  },
  {
    title: "Execution Framework",
    text: "Discipline, mentorship, and clear systems help members build confidence and long-term momentum.",
  },
];

export function TrustSection() {
  return (
    <section id="about" className="border-b border-border bg-surface py-20">
      <div className="section-shell">
        <SectionTitle
          eyebrow="About Financial Revolution 3.0"
          title="A modern mentorship and education ecosystem built for real growth"
          description="This is a premium member experience that combines education, mentorship, and automation so you can focus on results."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-xl border border-border bg-black p-6"
            >
              <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{pillar.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
