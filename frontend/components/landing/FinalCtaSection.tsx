import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section id="join" className="border-b border-border bg-black py-20">
      <div className="section-shell">
        <div className="rounded-2xl border border-gold/40 bg-surface p-8 text-center md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Join Financial Revolution 3.0
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-4xl">
            Start your membership and unlock the full community + training system
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
            This experience is designed for members who want structure, support, and consistent execution.
          </p>
          <Link
            href="/auth/sign-in"
            className="mt-8 inline-flex rounded-md bg-gold px-7 py-3 text-sm font-semibold text-black hover:bg-gold-soft"
          >
            Join Now
          </Link>
        </div>
      </div>
    </section>
  );
}
