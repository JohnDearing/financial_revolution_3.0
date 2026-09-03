import Image from "next/image";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="section-shell py-12 md:py-20">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface md:grid-cols-[1.05fr_1fr]">
          <section className="hidden bg-gradient-to-br from-surface via-black to-surface-muted p-8 md:flex md:flex-col">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center"
              aria-label="Financial Revolution 3.0 home"
            >
              <Image
                src="/images/logo.png"
                alt="Financial Revolution 3.0"
                width={320}
                height={120}
                className="h-28 w-auto max-w-full object-contain md:h-32"
                priority
              />
            </Link>
            <h2 className="text-3xl font-semibold text-white">
              Member and Admin Portal
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
              Access your learning, mentorship, and community operations from
              one secure platform.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-zinc-300">
              <li>- Secure authentication and email verification</li>
              <li>- Guided onboarding for new members</li>
              <li>- Role-based views for members and admins</li>
            </ul>
          </section>

          <section className="p-6 md:p-8">
            <Link
              href="/"
              className="mb-6 flex w-full items-center justify-center md:hidden"
              aria-label="Financial Revolution 3.0 home"
            >
              <Image
                src="/images/logo.png"
                alt="Financial Revolution 3.0"
                width={240}
                height={88}
                className="h-20 w-auto max-w-full object-contain"
                priority
              />
            </Link>
            <p className="text-xs uppercase tracking-[0.16em] text-gold">
              Secure Access
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
            <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
            <div className="mt-6">{children}</div>
            <p className="mt-6 text-xs text-zinc-500">
              Need help?{" "}
              <Link
                href="/auth/forgot-password"
                className="text-gold hover:text-gold-soft"
              >
                Contact support
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
