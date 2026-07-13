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

function statusTextLooksPaid(value: unknown) {
  const text = getString(value).toLowerCase().replace(/\s+/g, " ");
  if (!text) return false;
  if (/\b(unpaid|not paid|no payment|payment due|pending payment)\b/.test(text)) return false;
  return /\b(paid|payment received|deposit paid|invoice paid|initial paid|additional paid|fully paid|final balance paid)\b/.test(text);
}

function isRequestAlreadyPaid(data: Record<string, unknown>) {
  return [
    data.status,
    data.paymentStatus,
    data.checkoutStatus,
    data.laundryPaymentStatus,
    data.familyInvoiceStatus,
    data.invoiceStatus,
    data.additionalPaymentStatus,
    data.commercialInvoiceStatus,
    data.laundryFinalInvoiceStatus,
  ].some(statusTextLooksPaid) || Boolean(data.paidAt || data.paymentReceivedAt || data.laundryFinalBalancePaidAt || data.depositPaidAt || data.laundryDepositPaidAt);
}

function isRequestClosedOrInactive(data: Record<string, unknown>) {
  const status = getString(data.status).toLowerCase().replace(/\s+/g, " ");
  return Boolean(status) && (
    status === "archived" ||
    status === "canceled" ||
    status === "cancelled" ||
    status === "declined" ||
    status === "rejected" ||
    status === "not eligible" ||
    status.startsWith("closed") ||
    status.includes("no response")
  );
}

function isStripeSessionPaid(session: Stripe.Checkout.Session) {
  return session.payment_status === "paid" || session.status === "complete";
}

function getPaidStatusForRequest(data: Record<string, unknown>) {
  return getString(data.service) === "laundry-rescue" ? "Deposit Paid" : "Paid";
}

function getPaidPaymentStatusForRequest(data: Record<string, unknown>) {
  return getString(data.service) === "laundry-rescue" ? "Deposit Paid" : "Paid";
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  const safeTitle = escapeHtml(title);
  const safeText = escapeHtml(text);
  const isSuccess = tone === "success";
  const isError = tone === "error";
  const accent = isError ? "#9f2f1f" : isSuccess ? "#075c58" : "#075c58";
  const icon = isError ? "!" : isSuccess ? "✓" : "i";
  const statusLabel = isError ? "Checkout needs review" : isSuccess ? "Checkout handled" : "Checkout status";
  const iconBackground = isError ? "rgba(159, 47, 31, .10)" : "rgba(117, 194, 177, .24)";

  return new NextResponse(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex,nofollow" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NestHelper Checkout</title>
  <style>
    :root { --teal: #075c58; --gold: #b98a2f; --cream: #fbf6ea; --ink: #243232; --muted: #5b6a79; --border: #eadfc8; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      font-family: Arial, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at 18% 14%, rgba(117, 194, 177, .28), transparent 32%),
        radial-gradient(circle at 88% 20%, rgba(185, 138, 47, .18), transparent 28%),
        var(--cream);
    }
    main { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 28px 14px; }
    .card {
      width: min(100%, 680px);
      overflow: hidden;
      border: 1px solid rgba(234, 223, 200, .95);
      border-radius: 34px;
      background: rgba(255, 255, 255, .9);
      box-shadow: 0 18px 42px rgba(15, 23, 42, .10);
      backdrop-filter: blur(10px);
    }
    .brand { display: flex; align-items: center; gap: 12px; padding: 18px 22px; border-bottom: 1px solid var(--border); background: rgba(255, 255, 255, .78); }
    .brand img { width: 44px; height: 44px; object-fit: contain; border-radius: 14px; }
    .brand-title { margin: 0; color: var(--teal); font-size: 20px; font-weight: 900; letter-spacing: -.03em; line-height: 1; }
    .brand-subtitle { margin: 4px 0 0; color: var(--muted); font-size: 12px; font-weight: 800; letter-spacing: .10em; text-transform: uppercase; }
    .content { padding: 26px 22px 24px; text-align: center; }
    .icon { display: inline-flex; width: 64px; height: 64px; align-items: center; justify-content: center; border-radius: 999px; background: ${iconBackground}; color: ${accent}; font-size: 32px; font-weight: 900; box-shadow: inset 0 0 0 1px rgba(7, 92, 88, .08); }
    .eyebrow { margin: 18px 0 0; color: var(--gold); font-size: 12px; font-weight: 900; letter-spacing: .20em; text-transform: uppercase; }
    h1 { margin: 12px auto 0; max-width: 540px; color: ${accent}; font-size: clamp(32px, 8vw, 52px); line-height: 1.02; letter-spacing: -.05em; }
    .message { margin: 16px auto 0; max-width: 560px; color: rgba(36, 50, 50, .76); font-size: clamp(16px, 4.1vw, 19px); font-weight: 700; line-height: 1.75; }
    .status { margin: 22px auto 0; max-width: 460px; border: 1px solid var(--border); border-radius: 24px; background: var(--cream); padding: 14px 16px; color: var(--teal); font-size: 14px; font-weight: 900; }
    .footer { margin-top: 22px; color: rgba(36, 50, 50, .68); font-size: 14px; font-weight: 700; line-height: 1.7; }
    .footer a { color: var(--teal); font-weight: 900; text-decoration: none; }
    .actions { margin-top: 20px; display: flex; justify-content: center; }
    .button { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; border-radius: 999px; background: var(--teal); color: white; padding: 12px 20px; font-size: 14px; font-weight: 900; text-decoration: none; box-shadow: 0 10px 22px rgba(7, 92, 88, .18); }
    @media (max-width: 520px) {
      main { align-items: flex-start; padding-top: 22px; }
      .card { border-radius: 28px; }
      .brand { padding: 16px 18px; }
      .brand img { width: 40px; height: 40px; }
      .brand-title { font-size: 18px; }
      .content { padding: 24px 18px 22px; }
      .icon { width: 58px; height: 58px; font-size: 28px; }
      .message { line-height: 1.65; }
    }
  </style>
</head>
<body>
  <main>
    <section class="card" aria-labelledby="checkout-title">
      <div class="brand">
        <img src="/assets/brand/nesthelper-icon.png" alt="" />
        <div>
          <p class="brand-title">NestHelper</p>
          <p class="brand-subtitle">Secure checkout</p>
        </div>
      </div>
      <div class="content">
        <div class="icon" aria-hidden="true">${icon}</div>
        <p class="eyebrow">NestHelper checkout</p>
        <h1 id="checkout-title">${safeTitle}</h1>
        <p class="message">${safeText}</p>
        <div class="status">${statusLabel}</div>
        <p class="footer">Questions? Text NestHelper at <a href="sms:+14257901330">425-790-1330</a>.</p>
        <div class="actions"><a class="button" href="/">Back to NestHelper</a></div>
      </div>
    </section>
  </main>
</body>
</html>`, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
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
        title: "This checkout is already complete.",
        text: "Thanks — this NestHelper checkout already appears paid or completed. We’ll follow up with scheduling or service details. If you think this is wrong, text us and we’ll check it.",
      });
    }

    if (isRequestClosedOrInactive(data)) {
      return htmlPage({
        tone: "error",
        status: 410,
        title: "This checkout link is no longer active.",
        text: "This NestHelper request was closed, canceled, or archived. Please text us if you still need help and we can review the next step.",
      });
    }

    const existingSessionId = getString(data.checkoutSessionId);
    if (existingSessionId) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(existingSessionId);
        if (isStripeSessionPaid(existingSession)) {
          const paidUpdate: Record<string, unknown> = {
            status: getPaidStatusForRequest(data),
            paymentStatus: getPaidPaymentStatusForRequest(data),
            checkoutStatus: "Paid",
            paidAt: FieldValue.serverTimestamp(),
            paidSessionId: existingSession.id,
            paymentIntentId: typeof existingSession.payment_intent === "string" ? existingSession.payment_intent : "",
            smartCheckoutLastUsedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (getString(data.service) === "laundry-rescue") {
            paidUpdate.status = "Deposit Paid - Final Pending";
            paidUpdate.paymentStatus = "Deposit Paid - Final Pending";
            paidUpdate.laundryPaymentStatus = "Deposit Paid - Final Pending";
            paidUpdate.laundryDepositStatus = "Deposit Paid";
            paidUpdate.laundryDepositPaidAt = FieldValue.serverTimestamp();
          }

          await requestRef.update(paidUpdate);

          return htmlPage({
            tone: "success",
            title: "This checkout is already complete.",
            text: "Thanks — this NestHelper checkout was already completed. We’ll follow up with scheduling or service details.",
          });
        }

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
