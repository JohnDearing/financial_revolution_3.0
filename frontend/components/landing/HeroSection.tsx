import { LockKeyholeOpen } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden border-b border-border bg-black"
    >
      <div
        className="absolute inset-0 bg-cover bg-right-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero_banner.png')" }}
      />
      <div className="section-shell relative py-16 md:py-24 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="mt-4 text-4xl uppercase font-semibold text-white md:text-6xl">
            Financial
          </h1>
          <h1 className="text-4xl uppercase font-semibold gold-gradient md:text-6xl">
            Revolution 3.0
          </h1>
          <p className="text-xl font-semibold uppercase tracking-[0.22em] text-white">
            Learn. Build. Grow.
          </p>
          <hr className="w-1/4 border-gold! border-2 rounded-full my-4" />
          <p className="mt-5 max-w-xl text-base leading-8 text-zinc-200 md:text-lg">
            A premium financial education community designed to increase
            knowledge, strengthen discipline, and help members build long-term
            wealth with like-minded people.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center rounded-md bg-gold px-7 py-3 text-sm font-semibold text-black hover:bg-gold-soft"
            >
              <LockKeyholeOpen
                size={20}
                className="mr-2 text-black"
                aria-hidden="true"
              />
              Join Financial Revolution 3.0
            </Link>

            <a
              href="#benefits"
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface/90 px-7 py-3 text-sm font-semibold text-white hover:border-gold/60"
            >
              View Benefits
            </a>
          </div>
          <p className="mt-5 text-lg uppercase tracking-[0.12em] font-semibold text-gold">
            $150 one-time enrollment fee
          </p>
          <p className="text-lg uppercase tracking-[0.12em] font-semibold text-white">
            then <span className="text-gold font-bold text-xl">$99</span>/month
            after 30 days
          </p>
        </div>
      </div>
    </section>
  );
}
