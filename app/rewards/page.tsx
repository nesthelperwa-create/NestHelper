import type { Metadata } from "next";
import { RewardsExperience } from "@/components/rewards/RewardsExperience";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Launch Rewards | Spin for NestHelper Family Home Help",
  description:
    "Verify and spin NestHelper Launch Rewards for family home-help discounts, organizing add-ons, Smart Labels, and a rare chance to win a 3-hour Parent Reset.",
  alternates: { canonical: `${siteConfig.url}/rewards` },
  openGraph: {
    title: "NestHelper Launch Rewards",
    description: "Spin for a little breathing room. Launching August 5, 2026.",
    url: `${siteConfig.url}/rewards`,
    images: [siteConfig.assets.og],
  },
};

export const dynamic = "force-dynamic";

export default function RewardsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <RewardsExperience />
    </div>
  );
}
