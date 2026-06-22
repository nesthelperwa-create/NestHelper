export type StripePriceMode = "standard";

export const stripePriceEnvMap: Record<string, Record<StripePriceMode, string | undefined>> = {
  "parent-reset-2hr": {
    standard: process.env.STRIPE_PRICE_PARENT_RESET_STANDARD,
  },
  "family-reset-3hr": {
    standard: process.env.STRIPE_PRICE_FAMILY_RESET_STANDARD,
  },
  "helper-block-4hr": {
    standard: process.env.STRIPE_PRICE_HELPER_BLOCK_STANDARD,
  },
  "move-out-cleaning": {
    standard: process.env.STRIPE_PRICE_MOVE_OUT_CLEANING_STANDARD,
  },
  "errand-helper": {
    standard: process.env.STRIPE_PRICE_ERRAND_STANDARD,
  },
  "laundry-rescue": {
    standard: process.env.STRIPE_PRICE_LAUNDRY_DEPOSIT_STANDARD,
  },
};

export function normalizeStripePriceMode(_mode: unknown): StripePriceMode {
  return "standard";
}

export function getStripePriceId(serviceId: unknown, mode: unknown = "standard") {
  if (typeof serviceId !== "string" || !serviceId.trim()) return "";
  const normalizedMode = normalizeStripePriceMode(mode);
  return stripePriceEnvMap[serviceId]?.[normalizedMode] || "";
}
