export type StripePriceMode = "standard" | "founding";

export const stripePriceEnvMap: Record<string, Record<StripePriceMode, string | undefined>> = {
  "parent-reset-2hr": {
    standard: process.env.STRIPE_PRICE_PARENT_RESET_STANDARD,
    founding: process.env.STRIPE_PRICE_PARENT_RESET_FOUNDING,
  },
  "family-reset-3hr": {
    standard: process.env.STRIPE_PRICE_FAMILY_RESET_STANDARD,
    founding: process.env.STRIPE_PRICE_FAMILY_RESET_FOUNDING,
  },
  "helper-block-4hr": {
    standard: process.env.STRIPE_PRICE_HELPER_BLOCK_STANDARD,
    founding: process.env.STRIPE_PRICE_HELPER_BLOCK_FOUNDING,
  },
  "errand-helper": {
    standard: process.env.STRIPE_PRICE_ERRAND_STANDARD,
    founding: process.env.STRIPE_PRICE_ERRAND_FOUNDING,
  },
  "laundry-rescue": {
    standard: process.env.STRIPE_PRICE_LAUNDRY_DEPOSIT_STANDARD,
    founding: process.env.STRIPE_PRICE_LAUNDRY_DEPOSIT_FOUNDING,
  },
};

export function normalizeStripePriceMode(mode: unknown): StripePriceMode {
  return mode === "founding" ? "founding" : "standard";
}

export function getStripePriceId(serviceId: unknown, mode: unknown) {
  if (typeof serviceId !== "string" || !serviceId.trim()) return "";
  const normalizedMode = normalizeStripePriceMode(mode);
  return stripePriceEnvMap[serviceId]?.[normalizedMode] || "";
}
