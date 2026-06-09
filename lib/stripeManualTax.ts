import Stripe from "stripe";

export type ManualSalesTaxConfig = {
  enabled: boolean;
  rate: number;
  displayName: string;
  description: string;
};

function cleanNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  const clean = cleanString(value).toLowerCase();
  return ["true", "yes", "1", "on", "tax", "taxable"].includes(clean);
}

function formatPercentage(value: number) {
  return Number(value.toFixed(4)).toString();
}

export function resolveManualSalesTaxConfig(input: {
  enabled?: unknown;
  rate?: unknown;
  displayName?: unknown;
  description?: unknown;
}): ManualSalesTaxConfig {
  const enabled = cleanBoolean(input.enabled);
  const rate = enabled ? cleanNumber(input.rate) : 0;

  if (!enabled) {
    return {
      enabled: false,
      rate: 0,
      displayName: "WA Sales Tax",
      description: "No manual sales tax applied by NestHelper.",
    };
  }

  if (rate <= 0 || rate > 12.5) {
    throw new Error("Enter a valid manual sales tax rate between 0% and 12.5%, or turn sales tax off for this payment.");
  }

  return {
    enabled: true,
    rate: Number(rate.toFixed(4)),
    displayName: cleanString(input.displayName) || "WA Sales Tax",
    description:
      cleanString(input.description) ||
      "Manual Washington sales tax applied by NestHelper admin. Stripe automatic tax is disabled for this payment.",
  };
}

export async function getOrCreateManualSalesTaxRate(
  stripe: Stripe,
  config: ManualSalesTaxConfig,
  metadata: Record<string, string> = {}
) {
  if (!config.enabled) return "";

  const existing = await stripe.taxRates.list({ active: true, limit: 100 });
  const matched = existing.data.find((rate) => {
    const rateCountry = (rate as unknown as { country?: string }).country;
    const rateState = (rate as unknown as { state?: string }).state;

    return (
      !rate.inclusive &&
      rate.display_name === config.displayName &&
      rateCountry === "US" &&
      rateState === "WA" &&
      Math.abs(Number(rate.percentage || 0) - config.rate) < 0.0001
    );
  });

  if (matched) return matched.id;

  const created = await stripe.taxRates.create({
    display_name: config.displayName,
    description: config.description,
    percentage: config.rate,
    inclusive: false,
    country: "US",
    state: "WA",
    jurisdiction: "Washington",
    metadata: {
      source: "nesthelper_manual_sales_tax",
      ratePercent: formatPercentage(config.rate),
      automaticTaxDisabled: "true",
      ...metadata,
    },
  } as Stripe.TaxRateCreateParams);

  return created.id;
}

export function getManualSalesTaxMetadata(config: ManualSalesTaxConfig, taxRateId = "") {
  return {
    manualSalesTaxEnabled: config.enabled ? "true" : "false",
    manualSalesTaxRate: config.enabled ? formatPercentage(config.rate) : "0",
    manualSalesTaxDisplayName: config.displayName,
    manualSalesTaxRateId: taxRateId,
    stripeAutomaticTaxEnabled: "false",
  };
}

export function getManualSalesTaxFirestoreFields(config: ManualSalesTaxConfig, taxRateId = "") {
  return {
    manualSalesTaxEnabled: config.enabled,
    manualSalesTaxRate: config.enabled ? Number(config.rate.toFixed(4)) : 0,
    manualSalesTaxDisplayName: config.displayName,
    manualSalesTaxRateId: taxRateId,
    stripeAutomaticTaxEnabled: false,
  };
}

export function manualTaxRatesParam(taxRateId: string, taxable = true) {
  return taxRateId && taxable ? { tax_rates: [taxRateId] } : {};
}
