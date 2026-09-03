import Image from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaTelegramPlane,
  FaYoutube,
} from "react-icons/fa";

export function FooterSection() {
  return (
    <footer className="bg-surface pt-12 pb-6">
      <div className="section-shell grid gap-8 md:grid-cols-3">
        <div className="flex items-start gap-4">
          <Image
            src="/images/logo.png"
            alt="Financial Revolution 3.0 Logo"
            width={150}
            height={150}
            className="h-36 w-36 object-contain"
          />
          <div className="flex flex-col">
            <div>
              <p className="text-base font-semibold text-gold">
                Financial Revolution 3.0
              </p>
              <p className="mt-2 text-xs leading-6 text-zinc-400">
                Learn. Build. Grow.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <Link
                href="#"
                aria-label="Follow Financial Revolution 3.0 on Telegram"
                className="inline-flex items-center justify-center p-2 text-gold transition hover:border-gold hover:text-gold-soft"
              >
                <FaTelegramPlane size={24} aria-hidden="true" />
              </Link>

              <Link
                href="#"
                aria-label="Follow Financial Revolution 3.0 on Instagram"
                className="inline-flex items-center justify-center p-2 text-gold transition hover:border-gold hover:text-gold-soft"
              >
                <FaInstagram size={24} aria-hidden="true" />
              </Link>

              <Link
                href="#"
                aria-label="Follow Financial Revolution 3.0 on YouTube"
                className="inline-flex items-center justify-center p-2 text-gold transition hover:border-gold hover:text-gold-soft"
              >
                <FaYoutube size={24} aria-hidden="true" />
              </Link>

              <Link
                href="#"
                aria-label="Follow Financial Revolution 3.0 on Facebook"
                className="inline-flex items-center justify-center p-2 text-gold transition hover:border-gold hover:text-gold-soft"
              >
                <FaFacebookF size={24} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Our Mission
          </p>
          <p className="mt-3 text-xs leading-6 text-zinc-400">
            We help families improve financial education, mentorship, and
            community while building legacy-focused decision making.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Disclaimer
          </p>
          <p className="mt-3 text-xs leading-6 text-zinc-400">
            Educational content only. This is not financial, legal, or tax
            advice. Members are responsible for their own decisions and results.
          </p>
        </div>
      </div>
      <div className="section-shell mt-8 border-t border-border pt-4">
        <p className="text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Financial Revolution 3.0. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
