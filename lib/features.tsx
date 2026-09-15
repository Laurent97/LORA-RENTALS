"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const FEATURES: Record<string, { title: string; tagline: string; description: string; cta?: { label: string; href: string } }> = {
  tours: {
    title: "Chauffeur & Guided Tours",
    tagline: "Professional drivers and curated Rwanda experiences",
    description: "Hire a vetted, multi-language driver for city tours, airport transfers, and long-distance trips. Explore packages built by local experts.",
    cta: { label: "Browse tours", href: "/tours" },
  },
  insurance: {
    title: "Insurance & Roadside Assistance",
    tagline: "Drive with confidence",
    description: "Add protection tiers, 24/7 roadside help, breakdown guarantees, and damage waivers to any booking.",
    cta: { label: "View plans", href: "/insurance" },
  },
  "ev-fleet": {
    title: "LORA EV Fleet",
    tagline: "Rwanda's electric future",
    description: "Discover electric vehicles, charging maps, green badges, and carbon offset options.",
    cta: { label: "Browse EVs", href: "/ev-fleet" },
  },
  community: {
    title: "Community Car Sharing",
    tagline: "Cars from your neighborhood",
    description: "Peer-to-peer listings, neighborhood pickup, and trust circles for verified neighbors.",
    cta: { label: "Explore sharing", href: "/community" },
  },
  rewards: {
    title: "LORA Rewards Marketplace",
    tagline: "Redeem points for local perks",
    description: "Turn loyalty points into partner offers: hotel discounts, restaurant vouchers, fuel credits, and airtime.",
    cta: { label: "Redeem points", href: "/rewards" },
  },
  kyc: {
    title: "Video KYC Onboarding",
    tagline: "Faster, safer verification",
    description: "Complete identity verification with a short video selfie and AI-powered document match.",
    cta: { label: "Start video KYC", href: "/kyc" },
  },
  gamification: {
    title: "Gamification & Loyalty",
    tagline: "Earn badges, streaks, and credits",
    description: "Collect badges, keep rental streaks alive, complete challenges, and climb the leaderboard.",
    cta: { label: "View loyalty", href: "/dashboard/loyalty" },
  },
  corporate: {
    title: "Corporate & Fleet",
    tagline: "B2B car rental for teams",
    description: "Cost centers, approval chains, monthly invoices, and volume pricing for NGOs, embassies, and companies.",
    cta: { label: "LORA Business", href: "/business" },
  },
  "long-term": {
    title: "Long-Term Leases",
    tagline: "Monthly and yearly vehicle leases",
    description: "Lease a car for months with included maintenance, quarterly swaps, and flexible contracts.",
    cta: { label: "Browse leases", href: "/long-term" },
  },
};

export function FeaturePage({ slug }: { slug: string }) {
  const feature = FEATURES[slug] ?? { title: "Feature", tagline: "", description: "Coming soon." };
  const pathname = usePathname();
  const isRoot = pathname === "/features";
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="text-center">
        <p className="font-display text-2xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>{feature.title}</p>
        <p className="text-gold-500 mt-1 text-sm font-semibold" style={{ color: "#D4AF37" }}>{feature.tagline}</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{feature.description}</p>
          {feature.cta && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={feature.cta.href} className={cn(buttonVariants({ variant: "gold" }))}>{feature.cta.label}</Link>
              {!isRoot && (
                <Link href="/features" className={cn(buttonVariants({ variant: "outline" }))}>All features</Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        {BRAND.name} — premium car rental experience in East Africa
      </p>
    </div>
  );
}
