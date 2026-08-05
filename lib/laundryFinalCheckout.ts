import { randomBytes } from "crypto";
import Stripe from "stripe";
import {
  getOrCreateManualSalesTaxRate,
  manualTaxRatesParam,
  resolveManualSalesTaxConfig,
} from "@/lib/stripeManualTax";

const laundryProductTaxCode = (
  process.env.STRIPE_LAUNDRY_TAX_CODE ||
  process.env.STRIPE_PRODUCT_TAX_CODE ||
  process.env.STRIPE_TAX_CODE ||
  "txcd_20090012"
).trim();

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatMoneyFromCents(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.max(0, value) / 100);
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2).replace(/\.?0+$/, "") : "0";
}

function normalizeSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function generateLaundryFinalAccessToken() {
  return randomBytes(32).toString("hex");
}

export function getLaundryFinalStableUrl(token: string) {
  return `${normalizeSiteUrl()}/pay/laundry-final/${encodeURIComponent(token)}`;
}

export function isLaundryFinalCheckoutSessionPaid(session: Stripe.Checkout.Session) {
  return session.payment_status === "paid" || session.status === "complete";
}

export function isLaundryFinalCheckoutSessionUsable(session: Stripe.Checkout.Session) {
  if (!session.url || session.status !== "open") return false;
  if (!session.expires_at) return true;
  return session.expires_at * 1000 > Date.now() + 60_000;
}

export async function createLaundryFinalCheckoutSession({
  stripe,
  requestId,
  data,
  token,
}: {
  stripe: Stripe;
  requestId: string;
  data: Record<string, unknown>;
  token: string;
}) {
  const email = getString(data.email);
  const fullName = getString(data.fullName) || "NestHelper customer";
  const phone = getString(data.phone);
  const customerId =
    getString(data.laundryFinalInvoiceCustomerId) ||
    getString(data.laundryDepositStripeCustomerId) ||
    getString(data.stripeCustomerId);

  const dryWeightLbs = cleanNumber(data.laundryDryWeightLbs);
  const includedWeightLbs = cleanNumber(data.laundryIncludedWeightLbs) || 26.2;
  const additionalWeightLbs = cleanNumber(data.laundryAdditionalWeightLbs);
  const ratePerLb = cleanNumber(data.laundryRatePerLb) || 2.25;
  const additionalWeightAmountCents = Math.max(
    0,
    Math.round(
      cleanNumber(data.laundryAdditionalWeightAmountCents) ||
        cleanNumber(data.laundryBaseAmountCents) ||
        cleanNumber(data.laundryAdditionalWeightAmount) * 100 ||
        cleanNumber(data.laundryBaseAmount) * 100
    )
  );
  const addOnsAmountCents = Math.max(
    0,
    Math.round(cleanNumber(data.laundryAddOnsAmountCents) || cleanNumber(data.laundryAddOnsAmount) * 100)
  );
  const depositTaxCatchUpCents = Math.max(
    0,
    Math.round(cleanNumber(data.laundryDepositTaxCatchUpCents) || cleanNumber(data.laundryDepositTaxCatchUpAmount) * 100)
  );
  const balanceBeforeStripeTaxCents = additionalWeightAmountCents + addOnsAmountCents + depositTaxCatchUpCents;

  if (balanceBeforeStripeTaxCents <= 0) {
    throw new Error("No Laundry Rescue final balance is available for this payment link.");
  }

  const manualSalesTax = resolveManualSalesTaxConfig({
    enabled: data.manualSalesTaxEnabled,
    rate: data.manualSalesTaxRate,
    displayName: data.manualSalesTaxDisplayName,
  });
  let manualSalesTaxRateId = getString(data.manualSalesTaxRateId);
  if (manualSalesTax.enabled && !manualSalesTaxRateId) {
    manualSalesTaxRateId = await getOrCreateManualSalesTaxRate(stripe, manualSalesTax, {
      requestId,
      serviceId: "laundry-rescue",
      paymentType: "laundry_final_balance",
    });
  }

  const lineItems: any[] = [];

  if (additionalWeightAmountCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: additionalWeightAmountCents,
        tax_behavior: "exclusive",
        product_data: {
          tax_code: laundryProductTaxCode,
          name: "Laundry Rescue additional laundry",
          description: [
            `${formatNumber(additionalWeightLbs)} lb above the included minimum`,
            `${formatMoneyFromCents(Math.round(ratePerLb * 100))} per additional lb`,
            `Final dry weight: ${formatNumber(dryWeightLbs)} lb`,
            `Included weight: about ${formatNumber(includedWeightLbs)} lb`,
          ].join(" · ").slice(0, 1000),
        },
      },
      quantity: 1,
      ...manualTaxRatesParam(manualSalesTaxRateId),
    });
  }

  if (addOnsAmountCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: addOnsAmountCents,
        tax_behavior: "exclusive",
        product_data: {
          tax_code: laundryProductTaxCode,
          name: "Laundry Rescue add-ons / approved extras",
          description: [
            "Approved bulky items, special handling, extra sorting, stain attention, rush changes, or other reviewed laundry extras.",
            getString(data.laundryFinalBalanceNote),
          ]
            .filter(Boolean)
            .join(" ")
            .slice(0, 1000),
        },
      },
      quantity: 1,
      ...manualTaxRatesParam(manualSalesTaxRateId),
    });
  }

  if (depositTaxCatchUpCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: depositTaxCatchUpCents,
        product_data: {
          name: "Sales tax catch-up on intro minimum",
          description:
            "This charges only the previously missed sales-tax amount. The Laundry Rescue intro minimum itself is not being charged again.",
        },
      },
      quantity: 1,
    });
  }

  const siteUrl = normalizeSiteUrl();
  const stableUrl = getLaundryFinalStableUrl(token);
  const metadata: Record<string, string> = {
    requestId,
    serviceId: "laundry-rescue",
    serviceTitle: "Laundry Rescue final balance",
    paymentType: "laundry_final_balance",
    smartLaundryFinalCheckout: "true",
    laundryFinalAccessToken: token,
    dryWeightLbs: String(Number(dryWeightLbs.toFixed(2))),
    includedWeightLbs: String(Number(includedWeightLbs.toFixed(2))),
    additionalWeightLbs: String(Number(additionalWeightLbs.toFixed(2))),
    ratePerLb: String(Number(ratePerLb.toFixed(2))),
    addOnsAmountCents: String(addOnsAmountCents),
    depositTaxCatchUpCents: String(depositTaxCatchUpCents),
    customerName: fullName,
    customerEmail: email,
    customerPhone: phone,
    manualSalesTaxEnabled: manualSalesTax.enabled ? "true" : "false",
    manualSalesTaxRate: manualSalesTax.enabled ? String(manualSalesTax.rate) : "0",
    manualSalesTaxRateId,
  };

  const params: any = {
    mode: "payment",
    line_items: lineItems,
    automatic_tax: { enabled: false },
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    payment_method_types: ["card"],
    allow_promotion_codes: false,
    client_reference_id: requestId,
    success_url: `${siteUrl}/checkout?success=true&payment_type=laundry_final_balance&service_id=laundry-rescue&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: stableUrl,
    metadata,
    payment_intent_data: { metadata },
    custom_text: {
      submit: {
        message:
          "This is the remaining Laundry Rescue balance after the intro minimum already paid. Laundry is released after the final balance is fully paid.",
      },
    },
  };

  if (customerId) {
    params.customer = customerId;
    params.customer_update = { address: "auto", name: "auto", shipping: "auto" };
  } else if (email) {
    params.customer_email = email;
    params.customer_creation = "always";
  }

  const session = await stripe.checkout.sessions.create(params);
  return { session, manualSalesTaxRateId, stableUrl };
}
