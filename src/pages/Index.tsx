import UrgencyBanner from "@/components/home/UrgencyBanner";
import MarqueeBanner from "@/components/home/MarqueeBanner";
import HeroSection from "@/components/home/HeroSection";
import BestSellersSection from "@/components/home/BestSellersSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import TrustSection from "@/components/home/TrustSection";
import SocialProofSection from "@/components/home/SocialProofSection";
import PricingShowcase from "@/components/home/PricingShowcase";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FooterSection from "@/components/home/FooterSection";

export default function Index() {
  return (
    <div>
      {/* Urgency bar */}
      <UrgencyBanner />

      {/* Marquee */}
      <MarqueeBanner />

      {/* Hero */}
      <HeroSection />

      {/* Best Sellers */}
      <BestSellersSection />

      {/* Categories */}
      <CategoriesSection />

      {/* Pricing */}
      <PricingShowcase />

      {/* How it works */}
      <HowItWorksSection />

      {/* Trust */}
      <TrustSection />

      {/* Social Proof */}
      <SocialProofSection />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
