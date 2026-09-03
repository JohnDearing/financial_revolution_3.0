import Image from "next/image";

const benefits = [
  {
    title: "Live Classes 5 Days A Week",
    text: "Learn from experienced educators through weekly live sessions.",
    icon: "/images/what-you-get1.png",
  },
  {
    title: "Money$$$ Zone",
    text: "Learn how to mark up the chart for execution.",
    icon: "/images/what-you-get2.png",
  },
  {
    title: "Intelligent Diversification Class",
    text: "Learn strategies for creating multiple streams of income and managing risk.",
    icon: "/images/what-you-get3.png",
  },
  {
    title: "1-on-1 Mentorship Access",
    text: "Get personal guidance and support on your financial journey.",
    icon: "/images/what-you-get4.png",
  },
  {
    title: "Private Telegram Community",
    text: "Network and connect with a community of growth-minded individuals.",
    icon: "/images/what-you-get5.png",
  },
  {
    title: "Weekly Financial Education",
    text: "Stay informed and continue developing your financial knowledge.",
    icon: "/images/what-you-get6.png",
  },
];

export function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="border-b border-border bg-black py-12 md:py-16"
    >
      <div className="section-shell">
        <div className="rounded-xl border border-gold! bg-linear-to-b from-[#0a0a0a] to-black px-4 py-6">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-gold/70 md:w-20" />
            <h2 className="text-2xl font-semibold uppercase tracking-wider text-zinc-100 md:text-4xl">
              What You Get
            </h2>
            <span className="h-px w-12 bg-gold/70 md:w-20" />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6 xl:gap-4">
            {benefits.map((benefit, index) => (
              <article
                key={benefit.title}
                className={`rounded-md px-4 py-4 text-center xl:rounded-none xl:py-2 border-gold! ${
                  index > 0 ? "xl:border-l xl:border-gold/40" : ""
                }`}
              >
                <div className="mx-auto mb-3 h-16 w-16">
                  <Image
                    src={benefit.icon}
                    alt={benefit.title}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                  />
                </div>
                <h3 className="text-lg font-semibold uppercase leading-tight text-zinc-100 text-center">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-tight text-zinc-300 text-center">
                  {benefit.text}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <span className="rounded-md border border-gold! bg-black px-6 py-2 text-2xl font-semibold uppercase tracking-wide text-gold">
              And So Much More...
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
