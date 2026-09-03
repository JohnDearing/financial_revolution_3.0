"use client";

import { LockKeyholeOpen, Star } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const testimonials = [
  {
    name: "JAMES R.",
    quote: "The mentorship and community have completely changed my mindset.",
    avatar: "/images/testimonial-james.png",
    initials: "JR",
  },
  {
    name: "TIFFANY M.",
    quote:
      "The live classes and support have helped me become more disciplined with my finances.",
    avatar: "/images/testimonial-tiffany.png",
    initials: "TM",
  },
  {
    name: "DAVID T.",
    quote:
      "Financial Revolution 3.0 gave me access to a community that truly wants to see people win.",
    avatar: "/images/testimonial-david.png",
    initials: "DT",
  },
];

const AUTO_SLIDE_INTERVAL_MS = 5000;

function TestimonialAvatar({
  src,
  initials,
  name,
}: {
  src: string;
  initials: string;
  name: string;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-gold! lg:h-[84px] lg:w-[84px]">
      {!hasError ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-muted text-base font-bold text-gold">
          {initials}
        </div>
      )}
    </div>
  );
}

function StarRating() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className="h-3 w-3 fill-gold text-gold lg:h-3.5 lg:w-3.5"
          aria-hidden
        />
      ))}
    </div>
  );
}

function TestimonialCard({
  item,
  showDivider,
  slideWidthPercent,
}: {
  item: (typeof testimonials)[number];
  showDivider: boolean;
  slideWidthPercent: number;
}) {
  return (
    <article
      className={`flex h-full shrink-0 items-stretch px-4 py-6 md:px-6 md:py-8 lg:px-8 ${
        showDivider ? "border-r border-gold!" : ""
      }`}
      style={{ width: `${slideWidthPercent}%` }}
    >
      <div className="flex w-full items-start gap-3 lg:gap-4">
        <TestimonialAvatar
          src={item.avatar}
          initials={item.initials}
          name={item.name}
        />

        <div className="min-w-0 flex-1">
          <span
            className="block text-3xl leading-none text-gold lg:text-4xl"
            aria-hidden
          >
            &ldquo;
          </span>
          <p className="mt-1 text-xs leading-6 text-white lg:text-sm lg:leading-7">
            {item.quote}
          </p>
          <div className="mt-3">
            <StarRating />
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white lg:text-xs">
            - {item.name}
          </p>
        </div>
      </div>
    </article>
  );
}

function useVisibleCount() {
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === "undefined") {
      return 3;
    }

    return window.matchMedia("(min-width: 768px)").matches ? 3 : 1;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const updateVisibleCount = () => {
      setVisibleCount(mediaQuery.matches ? 3 : 1);
    };

    updateVisibleCount();
    mediaQuery.addEventListener("change", updateVisibleCount);

    return () => mediaQuery.removeEventListener("change", updateVisibleCount);
  }, []);

  return visibleCount;
}

export function TestimonialsSection() {
  const visibleCount = useVisibleCount();
  const [activeIndex, setActiveIndex] = useState(testimonials.length);
  const [isAnimating, setIsAnimating] = useState(true);
  const touchStartX = useRef(0);
  const isPausedRef = useRef(false);

  const extendedSlides = useMemo(
    () => [...testimonials, ...testimonials, ...testimonials],
    [],
  );

  const totalSlides = extendedSlides.length;
  const dotCount = testimonials.length;

  const goToNext = useCallback(() => {
    setActiveIndex((current) => current + 1);
  }, []);

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) => current - 1);
  }, []);

  const goToDot = useCallback((dotIndex: number) => {
    setActiveIndex(testimonials.length + dotIndex);
  }, []);

  useEffect(() => {
    if (activeIndex < testimonials.length) {
      const timeout = window.setTimeout(() => {
        setIsAnimating(false);
        setActiveIndex(activeIndex + testimonials.length);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsAnimating(true));
        });
      }, 500);

      return () => window.clearTimeout(timeout);
    }

    if (activeIndex >= testimonials.length * 2) {
      const timeout = window.setTimeout(() => {
        setIsAnimating(false);
        setActiveIndex(activeIndex - testimonials.length);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsAnimating(true));
        });
      }, 500);

      return () => window.clearTimeout(timeout);
    }
  }, [activeIndex]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!isPausedRef.current && document.visibilityState === "visible") {
        goToNext();
      }
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [goToNext]);

  const pauseAutoPlay = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resumeAutoPlay = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    pauseAutoPlay();
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const delta = touchStartX.current - event.changedTouches[0].clientX;

    if (Math.abs(delta) < 48) {
      resumeAutoPlay();
      return;
    }

    if (delta > 0) {
      goToNext();
    } else {
      goToPrevious();
    }

    window.setTimeout(resumeAutoPlay, AUTO_SLIDE_INTERVAL_MS);
  };

  const activeDot =
    (((activeIndex - testimonials.length) % dotCount) + dotCount) % dotCount;

  const trackWidthPercent = (totalSlides / visibleCount) * 100;
  const slideWidthPercent = 100 / totalSlides;
  const translatePercent = (activeIndex * 100) / totalSlides;

  return (
    <section
      id="testimonials"
      className="border-b border-border bg-black py-16 md:py-24"
    >
      <div className="section-shell">
        <div
          className="relative mx-auto max-w-6xl border border-gold! rounded-xl bg-black px-2 pb-8 pt-10 shadow-[0_0_30px_rgba(201,163,77,0.2)] md:px-0 md:pb-10 md:pt-12"
          onMouseEnter={pauseAutoPlay}
          onMouseLeave={resumeAutoPlay}
        >
          <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap bg-black px-4">
            <LockKeyholeOpen
              className="h-4 w-4 shrink-0 text-gold"
              aria-hidden
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-xs">
              Secure Checkout Powered By{" "}
              <span className="font-bold text-gold">Stripe</span>
            </p>
          </div>

          <div
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`flex ${isAnimating ? "transition-transform duration-500 ease-out" : ""}`}
              style={{
                width: `${trackWidthPercent}%`,
                transform: `translateX(-${translatePercent}%)`,
              }}
            >
              {extendedSlides.map((item, index) => (
                <TestimonialCard
                  key={`${item.name}-${index}`}
                  item={item}
                  slideWidthPercent={slideWidthPercent}
                  showDivider={
                    index >= activeIndex &&
                    index < activeIndex + visibleCount - 1
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2.5">
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={index === activeDot ? "true" : undefined}
                onClick={() => {
                  pauseAutoPlay();
                  goToDot(index);
                  window.setTimeout(resumeAutoPlay, AUTO_SLIDE_INTERVAL_MS);
                }}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === activeDot
                    ? "bg-gold"
                    : "bg-gold/30 hover:bg-gold/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
