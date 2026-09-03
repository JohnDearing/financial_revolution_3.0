import { ArrowRight, Check, Star } from "lucide-react";
import Link from "next/link";

const features = [
  "NO HIDDEN FEES",
  "CANCEL ANYTIME",
  "SECURE & SAFE",
  "100% ONLINE",
];

function GoldBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-xl bg-gold px-4 py-2 text-[10px] font-bold uppercase leading-tight tracking-[0.15em] text-black sm:text-[11px]">
      {children}
    </span>
  );
}

function VerticalDivider({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative hidden w-px shrink-0 self-stretch bg-gold md:block">
      {children}
    </div>
  );
}

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="border-b border-border bg-black py-16 md:py-24"
    >
      <div className="section-shell pb-12 md:pb-14">
        <div className="relative mx-auto max-w-6xl border border-gold! rounded-xl bg-black px-4 py-12 shadow-[0_0_30px_rgba(201,163,77,0.2)] md:px-0 md:py-14">
          <div className="flex flex-col md:flex-row md:items-stretch">
            {/* Left: enrollment fee */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center md:px-10 md:py-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white md:text-sm">
                START TODAY
              </p>
              <div className="my-6 flex w-full max-w-[220px] items-center">
                <span className="h-px flex-1 bg-gold" />
                <Star
                  className="mx-3 h-3.5 w-3.5 fill-gold text-gold"
                  aria-hidden
                />
                <span className="h-px flex-1 bg-gold" />
              </div>
              <p className="text-6xl font-bold leading-none text-white md:text-7xl">
                $150
              </p>
              <div className="mt-5">
                <GoldBadge>ONE-TIME ENROLLMENT FEE</GoldBadge>
              </div>
            </div>

            <VerticalDivider>
              <div className="absolute left-1/2 top-1/2 z-10 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold">
                <span className="text-center text-[10px] font-bold uppercase leading-[1.1] tracking-wide text-black">
                  THEN
                  <br />
                  ONLY
                </span>
              </div>
            </VerticalDivider>

            {/* Middle: monthly membership */}
            <div className="flex flex-1 flex-col items-center justify-center border-t border-gold px-6 py-6 text-center md:border-t-0 md:px-10 md:py-8">
              <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gold md:hidden">
                <span className="text-center text-[10px] font-bold uppercase leading-[1.1] tracking-wide text-black">
                  THEN
                  <br />
                  ONLY
                </span>
              </div>
              <p className="text-6xl font-bold leading-none text-white md:text-7xl">
                $99
                <span className="ml-1 text-base font-bold uppercase tracking-[0.2em] text-white md:text-lg">
                  /MONTH
                </span>
              </p>
              <div className="mt-5">
                <GoldBadge>RECURRING MONTHLY MEMBERSHIP</GoldBadge>
              </div>
            </div>

            <VerticalDivider />

            {/* Right: features */}
            <div className="flex flex-1 flex-col items-center justify-center border-t border-gold px-6 py-8 md:border-t-0 md:px-10">
              <ul className="flex flex-col gap-5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gold">
                      <Check
                        className="h-3 w-3 text-black"
                        strokeWidth={3}
                        aria-hidden
                      />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-white sm:text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            href="/auth/sign-in"
            className="absolute bottom-0 left-1/2 inline-flex w-[min(calc(100%-2rem),520px)] -translate-x-1/2 translate-y-1/2 items-center justify-center gap-3 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-black transition-colors hover:bg-gold-soft sm:text-sm"
          >
            JOIN FINANCIAL REVOLUTION 3.0
            <ArrowRight
              className="h-4 w-4 shrink-0"
              strokeWidth={2.5}
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
