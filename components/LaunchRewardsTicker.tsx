"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Gift, Sparkles, Star } from "lucide-react";
import { formatLaunchDate, getLaunchRewardsPhase } from "@/lib/launchRewards";

export function LaunchRewardsTicker() {
  const [phase, setPhase] = useState<"prelaunch" | "live" | "ended" | null>(null);

  useEffect(() => {
    const update = () => setPhase(getLaunchRewardsPhase());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const displayPhase = phase || "prelaunch";

  const tickerItems = useMemo(() => {
    if (displayPhase === "live") {
      return [
        "Launch Rewards are LIVE now",
        "Rare chance to win a free 3-hour Parent Reset",
        "Laundry, family-service, organizing, and Smart Label rewards",
        "No purchase necessary",
      ];
    }
    if (displayPhase === "ended") {
      return [
        "The initial Launch Rewards period has ended",
        "Open your saved rewards before they expire",
        "Watch for future NestHelper family promotions",
      ];
    }
    return [
      `Launch Rewards go live ${formatLaunchDate()}`,
      "Rare chance to win a free 3-hour Parent Reset",
      "Laundry, family-service, organizing, and Smart Label rewards",
      "No purchase necessary",
    ];
  }, [displayPhase]);

  const badge = displayPhase === "live" ? "Live now" : displayPhase === "ended" ? "Rewards" : "Coming soon";
  const ariaLabel = displayPhase === "live"
    ? "NestHelper Launch Rewards are live. Open the promotion."
    : displayPhase === "ended"
      ? "Open NestHelper saved Launch Rewards."
      : `NestHelper Launch Rewards go live ${formatLaunchDate()}. View the countdown and promotion details.`;

  return (
    <Link
      href="/rewards"
      aria-label={ariaLabel}
      className="group relative block overflow-hidden border-y border-nest-gold/25 bg-[linear-gradient(90deg,#004943,#08756c,#004943)] py-3 text-white shadow-[0_12px_32px_rgba(0,63,59,0.16)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(230,190,90,0.22),transparent_18rem),radial-gradient(circle_at_82%_40%,rgba(196,226,214,0.2),transparent_18rem)]" />
      <div className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-full border border-nest-gold2/40 bg-nest-teal3/85 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-nest-gold2 shadow-sm backdrop-blur sm:flex">
        <Gift size={14} /> {badge}
      </div>
      <div className="launch-rewards-marquee relative flex w-max min-w-full items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-7 px-4 sm:gap-10 sm:px-8 sm:pl-44" aria-hidden={copy === 1}>
            {tickerItems.map((item, index) => (
              <span key={`${copy}-${item}`} className="flex shrink-0 items-center gap-3 text-sm font-black sm:text-base">
                {index % 2 === 0 ? <Sparkles className="text-nest-gold2" size={17} /> : <Star className="fill-nest-gold2 text-nest-gold2" size={14} />}
                {item}
              </span>
            ))}
            <span className="flex shrink-0 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-black text-nest-gold2 transition group-hover:bg-white/16">
              {displayPhase === "live" ? "Spin now" : displayPhase === "ended" ? "View rewards" : "See the countdown"} <span aria-hidden="true">→</span>
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}
