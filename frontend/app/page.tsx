import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { HeaderSection } from "@/components/landing/HeaderSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { TrustSection } from "@/components/landing/TrustSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeaderSection />
      <HeroSection />
      <BenefitsSection />
      <TrustSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection />
      <FooterSection />
    </main>
  );
}
