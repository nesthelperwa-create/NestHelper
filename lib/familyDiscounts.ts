export type FamilyDiscountKind =
  | "none"
  | "launch_pricing"
  | "referral_customer_credit"
  | "promo_discount"
  | "courtesy_adjustment"
  | "manual_adjustment";

export const FAMILY_DISCOUNT_KIND_OPTIONS: Array<{ value: FamilyDiscountKind; label: string }> = [
  { value: "none", label: "No discount or credit" },
  { value: "launch_pricing", label: "Launch pricing" },
  { value: "referral_customer_credit", label: "Referral / saved customer credit" },
  { value: "promo_discount", label: "Promo code discount" },
  { value: "courtesy_adjustment", label: "Courtesy adjustment" },
  { value: "manual_adjustment", label: "Other price adjustment" },
];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const next = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(next) ? Math.max(0, next) : 0;
}

export function normalizeFamilyDiscountKind(value: unknown): FamilyDiscountKind {
  const clean = getString(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (clean === "launch_pricing" || clean === "launch") return "launch_pricing";
  if (["referral_customer_credit", "referral_credit", "customer_credit", "saved_customer_credit"].includes(clean)) {
    return "referral_customer_credit";
  }
  if (["promo_discount", "promo", "promotion", "promotion_discount"].includes(clean)) return "promo_discount";
  if (["courtesy_adjustment", "courtesy", "courtesy_credit"].includes(clean)) return "courtesy_adjustment";
  if (["manual_adjustment", "price_adjustment", "discount", "other"].includes(clean)) return "manual_adjustment";
  return "none";
}

function requestLooksLikeParentReset(requestData: Record<string, unknown>) {
  const raw = [requestData.service, requestData.selectedServiceTitle, requestData.packageType, requestData.requestType]
    .map((value) => getString(value).toLowerCase())
    .join(" ");
  return raw.includes("parent reset") || raw.includes("family reset") || raw.includes("parent-reset");
}

export function inferFamilyDiscountKind({
  breakdown,
  requestData,
  requiredReferralCreditAmount = 0,
}: {
  breakdown: Record<string, unknown>;
  requestData: Record<string, unknown>;
  requiredReferralCreditAmount?: number;
}): FamilyDiscountKind {
  const discountAmount = cleanNumber(breakdown.discountCredit);
  if (discountAmount <= 0) return "none";

  // A verified referral or saved customer credit always wins over wording/inference.
  if (requiredReferralCreditAmount > 0) return "referral_customer_credit";

  const explicit = normalizeFamilyDiscountKind(breakdown.discountKind || breakdown.discountType);
  if (explicit !== "none") return explicit;

  const searchable = [
    breakdown.discountLabel,
    breakdown.customerNote,
    breakdown.internalNotes,
    breakdown.quoteTitle,
    breakdown.paymentPlan,
    requestData.promoCode,
    requestData.promotionCode,
  ]
    .map((value) => getString(value).toLowerCase())
    .filter(Boolean)
    .join(" ");

  if (/\blaunch\b/.test(searchable)) return "launch_pricing";
  if (/\bpromo(?:tion)?\b|\bcoupon\b/.test(searchable)) return "promo_discount";
  if (/\bcourtesy\b|\bgoodwill\b/.test(searchable)) return "courtesy_adjustment";

  // Backward compatibility for existing Parent Reset drafts saved as $199 - $20 = $179
  // before discount types were recorded.
  const subtotal = cleanNumber(breakdown.subtotal);
  const amountDueNow = cleanNumber(breakdown.amountDueNow);
  if (
    requestLooksLikeParentReset(requestData) &&
    Math.abs(subtotal - 199) < 0.01 &&
    Math.abs(discountAmount - 20) < 0.01 &&
    Math.abs(amountDueNow - 179) < 0.01
  ) {
    return "launch_pricing";
  }

  return "manual_adjustment";
}

export function getFamilyDiscountLabel(kind: FamilyDiscountKind) {
  switch (kind) {
    case "launch_pricing":
      return "Launch pricing adjustment";
    case "referral_customer_credit":
      return "Referral/customer credit";
    case "promo_discount":
      return "Promo discount";
    case "courtesy_adjustment":
      return "Courtesy adjustment";
    case "manual_adjustment":
      return "Discount / price adjustment";
    default:
      return "Discount / credit";
  }
}

export function buildFamilyDiscountAppliedNote({
  kind,
  discountAmount,
  amountDueNow,
  existingText = "",
  formatMoney,
}: {
  kind: FamilyDiscountKind;
  discountAmount: number;
  amountDueNow: number;
  existingText?: string;
  formatMoney: (value: number) => string;
}) {
  if (discountAmount <= 0 || kind === "none") return "";

  const current = existingText.toLowerCase();
  const remaining = `The amount shown is the remaining amount due: ${formatMoney(amountDueNow)}.`;

  if (kind === "launch_pricing") {
    if (current.includes("launch pricing")) return "";
    return `Launch pricing has been applied, reducing the price by ${formatMoney(discountAmount)}. ${remaining}`;
  }

  if (kind === "referral_customer_credit") {
    if (current.includes("referral/customer credit") || current.includes("referral credit")) return "";
    return `Referral/customer credit of ${formatMoney(discountAmount)} has already been applied. ${remaining}`;
  }

  const label = getFamilyDiscountLabel(kind);
  if (current.includes(label.toLowerCase())) return "";
  return `${label} of ${formatMoney(discountAmount)} has already been applied. ${remaining}`;
}
