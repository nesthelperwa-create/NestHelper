export const LAUNCH_REWARDS_CAMPAIGN_ID = "nesthelper-launch-rewards-2026";
export const LAUNCH_REWARDS_TIME_ZONE = "America/Los_Angeles";
export const LAUNCH_REWARDS_LAUNCH_AT = "2026-08-05T00:00:00-07:00";
export const LAUNCH_REWARDS_END_AT = "2026-12-31T23:59:59-08:00";
export const LAUNCH_REWARDS_SPIN_COOLDOWN_DAYS = 7;
export const LAUNCH_REWARDS_MAX_SPINS_PER_MONTH = 4;
export const LAUNCH_REWARDS_GRAND_PRIZE_MONTHLY_LIMIT = 1;
export const LAUNCH_REWARDS_STANDARD_EXPIRATION_DAYS = 30;
export const LAUNCH_REWARDS_GRAND_CLAIM_HOURS = 72;

export type LaunchRewardPrizeId =
  | "laundry-10"
  | "parent-reset-15"
  | "nesthelper-credit-25"
  | "family-service-25"
  | "smart-label-starter"
  | "organizing-add-on"
  | "parent-reset-grand";

export type LaunchRewardPrize = {
  id: LaunchRewardPrizeId;
  shortLabel: string;
  title: string;
  description: string;
  customerMessage: string;
  weight: number;
  approximateOdds: string;
  valueCents: number;
  rewardKind: "discount" | "credit" | "add-on" | "grand-prize";
  eligibleServiceIds: string[];
  minimumSubtotalCents?: number;
  requiresPaidService: boolean;
  requiresManualVerification?: boolean;
};

export const launchRewardPrizes: LaunchRewardPrize[] = [
  {
    id: "laundry-10",
    shortLabel: "$10 Laundry",
    title: "$10 off Laundry Rescue",
    description: "Applies toward one Laundry Rescue order, including the $59 minimum.",
    customerMessage: "Laundry just got a little lighter.",
    weight: 4000,
    approximateOdds: "40%",
    valueCents: 1000,
    rewardKind: "discount",
    eligibleServiceIds: ["laundry-rescue"],
    requiresPaidService: true,
  },
  {
    id: "parent-reset-15",
    shortLabel: "$15 Parent Reset",
    title: "$15 off Parent Reset",
    description: "Applies to one standard-priced 3-hour Parent Reset Plan.",
    customerMessage: "A little more breathing room is waiting.",
    weight: 3000,
    approximateOdds: "30%",
    valueCents: 1500,
    rewardKind: "discount",
    eligibleServiceIds: ["family-reset-3hr"],
    requiresPaidService: true,
  },
  {
    id: "nesthelper-credit-25",
    shortLabel: "$25 Credit",
    title: "$25 NestHelper credit",
    description: "Applies to one eligible family home-help service with a $119 minimum subtotal.",
    customerMessage: "You unlocked a little extra help for home.",
    weight: 1500,
    approximateOdds: "15%",
    valueCents: 2500,
    rewardKind: "credit",
    eligibleServiceIds: [
      "family-reset-3hr",
      "specific-area-reset",
      "move-prep-home-reset",
      "errand-helper",
      "laundry-rescue",
    ],
    minimumSubtotalCents: 11900,
    requiresPaidService: true,
  },
  {
    id: "family-service-25",
    shortLabel: "$25 Family Help",
    title: "$25 off an eligible family service",
    description: "Applies to one eligible family service with a $119 minimum subtotal.",
    customerMessage: "Your next home-help visit just became easier to start.",
    weight: 1000,
    approximateOdds: "10%",
    valueCents: 2500,
    rewardKind: "discount",
    eligibleServiceIds: [
      "family-reset-3hr",
      "specific-area-reset",
      "move-prep-home-reset",
      "errand-helper",
      "laundry-rescue",
    ],
    minimumSubtotalCents: 11900,
    requiresPaidService: true,
  },
  {
    id: "smart-label-starter",
    shortLabel: "Smart Labels",
    title: "Free Smart Label Starter",
    description: "Includes up to 10 standard NestHelper Smart Labels during one eligible paid home service.",
    customerMessage: "Let’s make home easier to keep track of.",
    weight: 300,
    approximateOdds: "3%",
    valueCents: 4900,
    rewardKind: "add-on",
    eligibleServiceIds: ["family-reset-3hr", "specific-area-reset", "move-prep-home-reset"],
    requiresPaidService: true,
  },
  {
    id: "organizing-add-on",
    shortLabel: "Organizing Add-On",
    title: "Free small organizing add-on",
    description: "Includes up to 30 minutes of light organizing during one eligible paid reset.",
    customerMessage: "A little extra order is on us.",
    weight: 180,
    approximateOdds: "1.8%",
    valueCents: 3300,
    rewardKind: "add-on",
    eligibleServiceIds: ["family-reset-3hr", "specific-area-reset"],
    requiresPaidService: true,
  },
  {
    id: "parent-reset-grand",
    shortLabel: "FREE Parent Reset",
    title: "Free 3-hour Parent Reset",
    description: "One standard 3-hour Parent Reset Plan, valued at up to $199, pending eligibility verification.",
    customerMessage: "You found the rare Parent Reset prize!",
    weight: 20,
    approximateOdds: "1 in 500 eligible spins while available",
    valueCents: 19900,
    rewardKind: "grand-prize",
    eligibleServiceIds: ["family-reset-3hr"],
    requiresPaidService: false,
    requiresManualVerification: true,
  },
];

export const launchRewardsTotalWeight = launchRewardPrizes.reduce((sum, prize) => sum + prize.weight, 0);

export function getLaunchRewardPrize(prizeId: string | null | undefined) {
  return launchRewardPrizes.find((prize) => prize.id === prizeId);
}

export function getLaunchRewardsLaunchMs() {
  return new Date(LAUNCH_REWARDS_LAUNCH_AT).getTime();
}

export function getLaunchRewardsEndMs() {
  return new Date(LAUNCH_REWARDS_END_AT).getTime();
}

export function getLaunchRewardsPhase(nowMs = Date.now()) {
  if (nowMs < getLaunchRewardsLaunchMs()) return "prelaunch" as const;
  if (nowMs > getLaunchRewardsEndMs()) return "ended" as const;
  return "live" as const;
}

export function getPacificMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LAUNCH_REWARDS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || String(date.getUTCFullYear());
  const month = parts.find((part) => part.type === "month")?.value || String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatLaunchDate() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: LAUNCH_REWARDS_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(LAUNCH_REWARDS_LAUNCH_AT));
}

export function formatRewardsDate(value: string | number | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: LAUNCH_REWARDS_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
