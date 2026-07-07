import { LandingLayout } from "@/components/layout/LandingLayout";
import { HeroSection } from "@/components/layout/HeroSection";
import { ManifestoSection } from "@/components/layout/ManifestoSection";
import { FeatureSection } from "@/components/layout/FeatureSection";
import { RoadmapSection } from "@/components/layout/RoadmapSection";
import { PricingSection } from "@/components/layout/PricingSection";
import { ContactSection } from "@/components/layout/ContactSection";
import { AntiDetectSection } from "@/components/layout/AntiDetectSection";

export const metadata = {
  title: "Villiant Vault | Két Sắt + Bộ Não AI Cho Poker",
  description: "Giảm leak, tăng edge, exploit đúng người đúng lúc. Villiant Vault — két sắt AI đầu tiên cho poker của bạn.",
};

import { LanguageProvider } from "@/i18n/LanguageContext";

export default function LandingPage() {
  return (
    <LanguageProvider>
      <LandingLayout>
        <HeroSection />
        <ManifestoSection />
        <FeatureSection />
        <RoadmapSection />
        <AntiDetectSection />
        <PricingSection />
        <ContactSection />
      </LandingLayout>
    </LanguageProvider>
  );
}
