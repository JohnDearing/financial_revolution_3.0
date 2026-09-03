"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { SectionTitle } from "./SectionTitle";

const faqs = [
  {
    q: "Is this only a landing page?",
    a: "No. It includes subscription logic, secure member portal access, automations, and admin management.",
  },
  {
    q: "What happens if a payment fails?",
    a: "Webhook automation updates membership status and can trigger Telegram removal plus email notifications.",
  },
  {
    q: "Can this platform scale later?",
    a: "Yes. The architecture is modular so you can add tiers, courses, dashboards, and deeper analytics.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section
      id="faq"
      className="border-b border-border bg-black py-16 md:py-20"
    >
      <div className="section-shell">
        <SectionTitle
          eyebrow="FAQ"
          title="Common questions before joining"
          description="The answers below are focused on membership logic, payments, and access control."
        />

        <div className="mt-10 space-y-3 md:space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <article
                key={faq.q}
                className={`overflow-hidden rounded-xl border bg-surface transition-colors duration-200 ${
                  isOpen
                    ? "border-gold/50 shadow-[0_0_20px_rgba(201,163,77,0.08)]"
                    : "border-border hover:border-gold/30"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-start justify-between gap-4 p-5 text-left md:p-6"
                >
                  <h3 className="text-base font-semibold leading-snug text-gold md:text-lg">
                    {faq.q}
                  </h3>
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      isOpen
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-border bg-black text-zinc-400"
                    }`}
                    aria-hidden
                  >
                    {isOpen ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-7 text-zinc-300 md:px-6 md:pb-6 md:text-base">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
