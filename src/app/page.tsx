'use client';

import Header from '@/components/shared/Header';
import MarqueeBanner from '@/components/shared/MarqueeBanner';
import DynamicHeroSection from '@/components/homepage/DynamicHeroSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import CTASection from '@/components/homepage/CTASection';

export default function HomePage() {
  return (
    <div className="bg-gray-50" suppressHydrationWarning>
      <Header />
      <MarqueeBanner />
      <DynamicHeroSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}