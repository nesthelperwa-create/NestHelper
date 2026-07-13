import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { services } from "@/lib/services";
import { getStripePriceId } from "@/lib/stripePriceMap";
import { getManualSalesTaxMetadata, getOrCreateManualSalesTaxRate, manualTaxRatesParam, resolveManualSalesTaxConfig } from "@/lib/stripeManualTax";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const laundryProductTaxCode = (process.env.STRIPE_LAUNDRY_TAX_CODE || "txcd_20090012").trim();
const nontaxableProductTaxCode = (process.env.STRIPE_NONTAXABLE_TAX_CODE || "txcd_00000000").trim();
const commercialCleaningTaxCode = (process.env.STRIPE_COMMERCIAL_CLEANING_TAX_CODE || "txcd_20010004").trim();

type RouteContext = {
  params: Promise<{ token: string }> | { token: string };
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function moneyToCents(value: unknown) {
  return Math.round(Math.max(0, cleanNumber(value)) * 100);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number.isFinite(value) ? value : 0);
}

function formatServicePeriodLabel(start: unknown, end: unknown) {
  const cleanStart = getString(start);
  const cleanEnd = getString(end);
  if (cleanStart && cleanEnd) return `${cleanStart} to ${cleanEnd}`;
  if (cleanStart) return `Starts ${cleanStart}`;
  if (cleanEnd) return `Through ${cleanEnd}`;
  return "";
}

function getServiceTitle(serviceId: string, data: Record<string, unknown>) {
  return getString(data.selectedServiceTitle) || services.find((item) => item.id === serviceId)?.title || serviceId || "NestHelper service";
}

function getStripeServiceAddress(data: Record<string, unknown>): Stripe.AddressParam | undefined {
  const line1 = getString(data.serviceAddressLine1) || getString(data.address) || getString(data.serviceAddress) || getString(data.streetAddress);
  const line2 = getString(data.serviceAddressLine2) || getString(data.address2) || getString(data.unit) || getString(data.apartment);
  const city = getString(data.serviceCity) || getString(data.city);
  const state = getString(data.serviceState) || getString(data.state) || "WA";
  const postal_code = getString(data.serviceZip) || getString(data.zip) || getString(data.zipCode) || getString(data.postalCode);

  if (!line1 || !city || !postal_code) return undefined;
  return {
    line1,
    line2: line2 || undefined,
    city,
    state,
    postal_code,
    country: "US",
  };
}

async function createStripeCustomerFromRequestAddress({
  data,
  requestId,
  serviceId,
  serviceTitle,
}: {
  data: Record<string, unknown>;
  requestId: string;
  serviceId: string;
  serviceTitle: string;
}) {
  if (!stripe) return null;
  const address = getStripeServiceAddress(data);
  if (!address) return null;

  return stripe.customers.create({
    email: getString(data.email) || undefined,
    name: getString(data.fullName) || getString(data.contactName) || undefined,
    phone: getString(data.phone) || undefined,
    address,
    metadata: {
      requestId,
      serviceId,
      serviceTitle,
      addressSource: "nesthelper_service_request",
    },
  });
}

type LaundryFinalPaymentCustomField = {
  key: string;
  label: { type: "custom"; custom: string };
  type: "dropdown";
  optional: boolean;
  dropdown: { options: { label: string; value: string }[] };
};

function buildLaundryFinalPaymentCustomFields(): LaundryFinalPaymentCustomField[] {
  return [
    {
      key: "laundry_final_payment_preference",
      label: { type: "custom", custom: "Final Laundry Rescue balance" },
      type: "dropdown",
      optional: false,
      dropdown: {
        options: [
          { label: "Auto-charge saved card after weigh-in", value: "autocharge" },
          { label: "Email final invoice before delivery", value: "invoicebeforedelivery" },
        ],
      },
    },
  ];
}

const COMMERCIAL_TAXABLE_PRESETS = new Set([
  "firstTimeReset",
  "carpetDeepCleaning",
  "spotTreatment",
  "floorScrub",
  "buffShine",
  "waxFinish",
  "stripWax",
  "turnover",
  "linenRestock",
]);

const COMMERCIAL_NONTAXABLE_PRESETS = new Set([
  "routineVisit",
  "recurringMonthly",
  "laborHours",
]);

function getCommercialLineTaxMode(line: Record<string, unknown>) {
  const preset = getString(line.preset);
  const explicitTaxMode = getString(line.taxMode || line.taxStatus || line.taxable).toLowerCase();
  const searchable = [line.label, line.description, line.note]
    .map((value) => getString(value).toLowerCase())
    .filter(Boolean)
    .join(" ");

  if (["taxable", "sales_tax", "sales tax", "true", "yes"].includes(explicitTaxMode)) return "taxable";
  if (["nontaxable", "non_taxable", "no_tax", "no tax", "false", "no"].includes(explicitTaxMode)) return "nontaxable";
  if (COMMERCIAL_TAXABLE_PRESETS.has(preset)) return "taxable";
  if (COMMERCIAL_NONTAXABLE_PRESETS.has(preset)) return "nontaxable";
  if (/\b(carpet|deep clean|deep-clean|first[-\s]?time|floor scrub|buff|shine|wax|strip|turnover|linen|restock|specialty|specialized|non[-\s]?repetitive)\b/.test(searchable)) return "taxable";
  return "nontaxable";
}

function commercialBreakdownHasTaxableLines(breakdown: Record<string, unknown>) {
  const lines = Array.isArray(breakdown.lineItems) ? (breakdown.lineItems as Record<string, unknown>[]) : [];
  return lines.some((line) => getCommercialLineTaxMode(line) === "taxable");
}

function isRequestAlreadyPaid(data: Record<string, unknown>) {
  const statusText = [
    data.status,
    data.paymentStatus,
    data.checkoutStatus,
    data.laundryPaymentStatus,
    data.familyInvoiceStatus,
    data.invoiceStatus,
  ].map((value) => getString(value).toLowerCase()).join(" ");

  return statusText.includes("paid") || statusText.includes("payment received") || statusText.includes("completed");
}

function isStripeSessionUsable(session: Stripe.Checkout.Session) {
  const now = Math.floor(Date.now() / 1000);
  return Boolean(
    session.status === "open" &&
    session.payment_status !== "paid" &&
    session.url &&
    (!session.expires_at || session.expires_at > now + 60)
  );
}

function getDefaultCustomTitle(serviceTitle: string, isLaundryRescue: boolean) {
  return isLaundryRescue ? "Laundry Rescue custom intro minimum" : `${serviceTitle} custom checkout`;
}

function getLaundryDepositAmount(data: Record<string, unknown>) {
  const saved = cleanNumber(data.laundryDepositExpectedAmount || data.customInitialAmount || data.laundryDepositAmount);
  return saved > 0 ? saved : 59;
}

function htmlPage({
  title,
  text,
  status = 200,
  tone = "neutral",
}: {
  title: string;
  text: string;
  status?: number;
  tone?: "neutral" | "success" | "error";
}) {
  const color = tone === "success" ? "#166534" : tone === "error" ? "#991b1b" : "#075c58";
  const safeTitle = title.replace(/[<>&]/g, "");
  const safeText = text.replace(/[<>&]/g, "");

  return new NextResponse(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex,nofollow" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NestHelper Checkout</title>
</head>
<body style="margin:0;background:#fbf6ea;color:#243232;font-family:Arial,sans-serif;">
  <main style="min-height:100vh;padding:40px 16px;box-sizing:border-box;">
    <section style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #eadfc8;border-radius:32px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,.06);">
      <p style="margin:0 0 12px 0;color:#b98a2f;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;">NestHelper checkout</p>
      <h1 style="margin:0 0 12px 0;color:${color};font-size:30px;line-height:1.18;">${safeTitle}</h1>
      <p style="margin:0;color:#475569;font-size:16px;line-height:1.65;font-weight:600;">${safeText}</p>
      <p style="margin:22px 0 0 0;color:#475569;font-size:14px;line-height:1.6;font-weight:600;">Questions? Text NestHelper at <strong style="color:#075c58;">425-790-1330</strong>.</p>
    </section>
  </main>
</body>
</html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function createFreshCheckoutSession({
  requestId,
  data,
  token,
}: {
  requestId: string;
  data: Record<string, unknown>;
  token: string;
}) {
  if (!stripe) throw new Error("Stripe is not configured.");

  const serviceId = getString(data.service);
  if (!serviceId) throw new Error("This request is missing a service selection.");

  const serviceTitle = getServiceTitle(serviceId, data);
  const isLaundryRescue = serviceId === "laundry-rescue";
  const isCommercialReset = serviceId === "commercial-reset";
  const savedCommercialBreakdown = (data.commercialQuoteBreakdown || {}) as Record<string, unknown>;
  const savedFamilyBreakdown = (data.familyPaymentBreakdown || {}) as Record<string, unknown>;
  const useCustomInitial = Boolean(data.customInitialPayment) || getString(data.paymentMode) === "custom" || cleanNumber(data.customInitialAmount) > 0 || isLaundryRescue;
  const customAmount = isLaundryRescue ? getLaundryDepositAmount(data) : cleanNumber(data.customInitialAmount);
  const customAmountCents = moneyToCents(customAmount);
  const customTitle = getString(data.customInitialTitle) || getDefaultCustomTitle(serviceTitle, isLaundryRescue);
  const customNote = getString(data.customInitialNote);
  const priceId = !useCustomInitial && !isLaundryRescue ? getString(data.stripePriceId) || getStripePriceId(serviceId, "standard") : "";

  if (useCustomInitial && customAmountCents <= 0) {
    throw new Error("This checkout amount is missing. Please ask NestHelper to resend the checkout link.");
  }

  if (!isLaundryRescue && !useCustomInitial && !priceId) {
    throw new Error("This checkout link needs to be refreshed by NestHelper.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const email = getString(data.email);
  const fullName = getString(data.fullName);
  const phone = getString(data.phone);
  const servicePeriodLabel =
    getString(data.checkoutServicePeriodLabel) ||
    (isCommercialReset
      ? getString(savedCommercialBreakdown.servicePeriodLabel) || formatServicePeriodLabel(savedCommercialBreakdown.servicePeriodStart, savedCommercialBreakdown.servicePeriodEnd)
      : getString(savedFamilyBreakdown.servicePeriodLabel) || formatServicePeriodLabel(savedFamilyBreakdown.servicePeriodStart, savedFamilyBreakdown.servicePeriodEnd));

  const manualSalesTax = resolveManualSalesTaxConfig({
    enabled: data.manualSalesTaxEnabled,
    rate: data.manualSalesTaxRate,
    displayName: data.manualSalesTaxDisplayName,
  });
  const manualSalesTaxRateId = await getOrCreateManualSalesTaxRate(stripe, manualSalesTax, {
    requestId,
    serviceId,
    paymentType: isLaundryRescue ? "laundry_deposit_refresh" : "smart_checkout_refresh",
  });

  const checkoutLineItems = isLaundryRescue
    ? [
        {
          price_data: {
            currency: "usd",
            unit_amount: customAmountCents,
            tax_behavior: "exclusive" as const,
            product_data: {
              tax_code: laundryProductTaxCode,
              name: customTitle || "Laundry Rescue non-refundable intro minimum",
              description: [
                customNote || "Non-refundable Laundry Rescue intro minimum. The $59 minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs. Additional laundry, add-ons, bulky items, or approved changes are reviewed separately.",
                "Final balance is handled after dry weigh-in. The customer chooses auto-charge or invoice-before-delivery during checkout.",
              ].filter(Boolean).join("\n").slice(0, 1000),
            },
          },
          quantity: 1,
          ...manualTaxRatesParam(manualSalesTaxRateId),
        },
      ]
    : useCustomInitial
      ? [
          {
            price_data: {
              currency: "usd",
              unit_amount: customAmountCents,
              tax_behavior: "exclusive" as const,
              product_data: {
                tax_code: isCommercialReset && commercialBreakdownHasTaxableLines(savedCommercialBreakdown) ? commercialCleaningTaxCode : nontaxableProductTaxCode,
                name: customTitle,
                description: [customNote || `${serviceTitle} — ${formatMoney(customAmount)}`, servicePeriodLabel ? `Service period: ${servicePeriodLabel}` : ""].filter(Boolean).join("\n").slice(0, 1000),
              },
            },
            quantity: 1,
            ...manualTaxRatesParam(manualSalesTaxRateId),
          },
        ]
      : [{ price: priceId, quantity: 1, ...manualTaxRatesParam(manualSalesTaxRateId) }];

  const successPaymentType = isLaundryRescue ? "laundry_deposit" : useCustomInitial ? "custom_initial" : "service_payment";
  const checkoutParams: any = {
    mode: "payment",
    line_items: checkoutLineItems,
    automatic_tax: { enabled: false },
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    allow_promotion_codes: !useCustomInitial && !isLaundryRescue,
    customer_email: email || undefined,
    client_reference_id: requestId,
    success_url: `${siteUrl}/checkout?success=true&payment_type=${successPaymentType}&service_id=${encodeURIComponent(serviceId)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout?cancelled=true&payment_type=${successPaymentType}&service_id=${encodeURIComponent(serviceId)}&request_id=${requestId}`,
    metadata: {
      requestId,
      serviceId,
      serviceTitle,
      paymentMode: useCustomInitial ? "custom" : "standard",
      paymentType: isLaundryRescue ? "laundry_deposit" : "service_payment",
      customInitialPayment: useCustomInitial ? "true" : "false",
      customInitialTitle: useCustomInitial ? customTitle : "",
      customInitialNote: useCustomInitial ? customNote : "",
      customInitialAmount: useCustomInitial ? String(Number(customAmount.toFixed(2))) : "",
      checkoutAccessToken: token,
      smartCheckoutRefresh: "true",
      laundryDepositNonRefundable: isLaundryRescue ? "true" : "",
      laundryDepositAmount: isLaundryRescue ? String(Number(customAmount.toFixed(2))) : "",
      laundryFinalPaymentOptions: isLaundryRescue ? "auto_charge_or_invoice_before_delivery" : "",
      taxHandling: manualSalesTax.enabled ? "manual_sales_tax" : "no_sales_tax",
      ...getManualSalesTaxMetadata(manualSalesTax, manualSalesTaxRateId),
      servicePeriodLabel,
      servicePeriodStart: getString(data.checkoutServicePeriodStart),
      servicePeriodEnd: getString(data.checkoutServicePeriodEnd),
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
    },
  };

  if (isLaundryRescue) {
    const customerWithServiceAddress = await createStripeCustomerFromRequestAddress({ data, requestId, serviceId, serviceTitle });
    if (customerWithServiceAddress) {
      checkoutParams.customer = customerWithServiceAddress.id;
      delete checkoutParams.customer_email;
      checkoutParams.customer_update = { address: "auto", name: "auto", shipping: "auto" };
      checkoutParams.metadata.serviceAddressProvidedToStripe = "true";
    } else {
      checkoutParams.customer_creation = "always";
    }

    checkoutParams.payment_method_types = ["card"];
    checkoutParams.payment_intent_data = { setup_future_usage: "off_session" };
    checkoutParams.custom_fields = buildLaundryFinalPaymentCustomFields();
    checkoutParams.custom_text = {
      submit: {
        message:
          "Laundry Rescue intro minimum is non-refundable and includes pickup, wash, dry, fold, return, and up to about 26.2 lbs. If you choose auto-charge, NestHelper may charge your saved payment method for any additional laundry, approved add-ons, or bulky items after dry weight is confirmed. If you choose invoice-before-delivery, laundry is held until any final invoice is fully paid.",
      },
    };
  }

  return stripe.checkout.sessions.create(checkoutParams as any);
}

export async function GET(_request: Request, context: RouteContext) {
  const resolvedParams = await Promise.resolve(context.params);
  const token = getString(resolvedParams.token);

  if (!token || token.length < 24) {
    return htmlPage({
      tone: "error",
      status: 404,
      title: "This checkout link is not valid.",
      text: "Please use the latest NestHelper checkout email or text us and we can resend it.",
    });
  }

  if (!stripe) {
    return htmlPage({
      tone: "error",
      status: 503,
      title: "Checkout is temporarily unavailable.",
      text: "Stripe is not configured for this checkout. Please text NestHelper and we can help.",
    });
  }

  try {
    const db = getFirebaseAdminDb();
    const requestSnap = await db.collection("serviceRequests").where("checkoutAccessToken", "==", token).limit(1).get();

    if (requestSnap.empty) {
      return htmlPage({
        tone: "error",
        status: 404,
        title: "This checkout link was not found.",
        text: "Please use the latest NestHelper checkout email or text us and we can resend it.",
      });
    }

    const requestDoc = requestSnap.docs[0];
    const requestId = requestDoc.id;
    const requestRef = requestDoc.ref;
    const data = requestDoc.data() || {};

    if (isRequestAlreadyPaid(data)) {
      return htmlPage({
        tone: "success",
        title: "This request already looks paid.",
        text: "Thanks — this NestHelper request already appears paid or completed. If you think this is wrong, text us and we’ll check it.",
      });
    }

    const existingSessionId = getString(data.checkoutSessionId);
    if (existingSessionId) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(existingSessionId);
        if (isStripeSessionUsable(existingSession) && existingSession.url) {
          return NextResponse.redirect(existingSession.url, { status: 303 });
        }
      } catch {
        // If the old session cannot be retrieved, create a fresh one below.
      }
    }

    const freshSession = await createFreshCheckoutSession({ requestId, data, token });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const smartCheckoutUrl = `${siteUrl}/pay/${token}`;

    await requestRef.update({
      checkoutUrl: smartCheckoutUrl,
      smartCheckoutUrl,
      stripeCheckoutUrl: freshSession.url || "",
      checkoutSessionId: freshSession.id,
      checkoutRefreshedAt: FieldValue.serverTimestamp(),
      checkoutRefreshCount: FieldValue.increment(1),
      checkoutLinkType: "smart_checkout",
      updatedAt: FieldValue.serverTimestamp(),
      smartCheckoutLastUsedAt: FieldValue.serverTimestamp(),
    });

    if (freshSession.url) {
      return NextResponse.redirect(freshSession.url, { status: 303 });
    }

    return htmlPage({
      tone: "error",
      status: 502,
      title: "Checkout could not open.",
      text: "Stripe did not return a checkout URL. Please text NestHelper and we can resend it.",
    });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Please text NestHelper and we can resend the checkout link.";
    return htmlPage({
      tone: "error",
      status: 500,
      title: "Checkout could not open.",
      text: message,
    });
  }
}
