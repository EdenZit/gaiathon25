import type { Metadata } from 'next';
import { HeroSection } from '@/components/marketing/hero';
import { HighlightsSection } from '@/components/marketing/highlights';
import { StatsSection } from '@/components/marketing/stats';

export const metadata: Metadata = {
  title: 'GAIAthon25 - Global AI & Sustainability Hackathon',
  description: 'Join the world&apos;s premier hackathon for sustainable technology solutions. Transform ideas into impact.',
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <HighlightsSection />
      <StatsSection />
    </>
  );
} 