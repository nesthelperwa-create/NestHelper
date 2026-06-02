import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { emailAliases } from "@/lib/emailRouting";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { services } from "@/lib/services";
import { getStripePriceId, normalizeStripePriceMode } from "@/lib/stripePriceMap";
import { sendPaymentLinkEmail } from "@/lib/sendPaymentLinkEmail";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const enableAutomaticTax = process.env.ENABLE_STRIPE_AUTOMATIC_TAX !== "false";
const laundryProductTaxCode = (process.env.STRIPE_LAUNDRY_TAX_CODE || "txcd_20090012").trim();
const nontaxableProductTaxCode = (process.env.STRIPE_NONTAXABLE_TAX_CODE || "txcd_00000000").trim();
const commercialCleaningTaxCode = (process.env.STRIPE_COMMERCIAL_CLEANING_TAX_CODE || "txcd_20010004").trim();

type CreatePaymentLinkBody = {
  requestId?: string;
  mode?: "standard" | "founding";
  sendEmail?: boolean;
  customInitial?: boolean;
  customAmount?: number | string;
  customTitle?: string;
  customNote?: string;
  includeQuoteBreakdown?: boolean;
  includeFamilyBreakdown?: boolean;
};


function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function moneyToCents(value: number) {
  return Math.round(Math.max(0, value) * 100);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number.isFinite(value) ? value : 0);
}

function getLaundryDepositAmount(mode: "standard" | "founding", customAmount: number, useCustomInitial: boolean) {
  if (useCustomInitial && customAmount > 0) return customAmount;
  return mode === "founding" ? 49 : 59;
}

type LaundryFinalPaymentCustomField = {
  key: string;
  label: { type: "custom"; custom: string };
  type: "dropdown";
  optional: boolean;
  dropdown: { options: Array<{ label: string; value: string }> };
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

function formatServicePeriodLabel(start: unknown, end: unknown) {
  const cleanStart = getString(start);
  const cleanEnd = getString(end);
  if (cleanStart && cleanEnd) return `${cleanStart} to ${cleanEnd}`;
  if (cleanStart) return `Starts ${cleanStart}`;
  if (cleanEnd) return `Through ${cleanEnd}`;
  return "";
}

function getServicePriceLabel(serviceId: string, mode: "standard" | "founding") {
  const service = services.find((item) => item.id === serviceId);
  if (!service) return "";
  return mode === "founding" ? service.foundingPrice || service.standardPrice : service.standardPrice;
}

function getDefaultCustomTitle(serviceTitle: string, isLaundryRescue: boolean) {
  return isLaundryRescue ? "Laundry Rescue custom deposit" : `${serviceTitle} custom checkout`;
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

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb(); // initializes Firebase Admin app
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    if (!stripe) {
      return NextResponse.json({ ok: false, error: "Stripe is not configured. Add STRIPE_SECRET_KEY in Vercel." }, { status: 500 });
    }

    const body = (await request.json().catch(() => null)) as CreatePaymentLinkBody | null;
    const requestId = getString(body?.requestId);
    const mode = normalizeStripePriceMode(body?.mode);
    const shouldSendEmail = body?.sendEmail !== false;
    const useCustomInitial = Boolean(body?.customInitial);
    const shouldIncludeQuoteBreakdown = body?.includeQuoteBreakdown !== false;
    const shouldIncludeFamilyBreakdown = body?.includeFamilyBreakdown !== false;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });
    }

    const data = requestSnap.data() || {};
    const serviceId = getString(data.service);
    const serviceTitle = getString(data.selectedServiceTitle) || services.find((item) => item.id === serviceId)?.title || serviceId || "NestHelper service";
    const isLaundryRescue = serviceId === "laundry-rescue";
    const isCommercialReset = serviceId === "commercial-reset";
    const savedCommercialBreakdown = (data.commercialQuoteBreakdown || {}) as Record<string, unknown>;
    const savedCommercialBreakdownText = isCommercialReset ? getString(savedCommercialBreakdown.customerBreakdownText) : "";
    const savedFamilyBreakdown = (data.familyPaymentBreakdown || {}) as Record<string, unknown>;
    const savedFamilyBreakdownText = !isCommercialReset ? getString(savedFamilyBreakdown.customerBreakdownText) : "";
    const servicePeriodLabel = isCommercialReset
      ? getString(savedCommercialBreakdown.servicePeriodLabel) || formatServicePeriodLabel(savedCommercialBreakdown.servicePeriodStart, savedCommercialBreakdown.servicePeriodEnd)
      : getString(savedFamilyBreakdown.servicePeriodLabel) || formatServicePeriodLabel(savedFamilyBreakdown.servicePeriodStart, savedFamilyBreakdown.servicePeriodEnd);

    if (!serviceId) {
      return NextResponse.json({ ok: false, error: "Missing service selection for this request." }, { status: 400 });
    }

    const customAmount = cleanNumber(body?.customAmount);
    const customAmountCents = moneyToCents(customAmount);
    const customTitle = getString(body?.customTitle) || getDefaultCustomTitle(serviceTitle, isLaundryRescue);
    const customNote = getString(body?.customNote);
    const priceId = useCustomInitial || isLaundryRescue ? "" : getStripePriceId(serviceId, mode);

    if (useCustomInitial && customAmountCents <= 0) {
      return NextResponse.json({ ok: false, error: "Enter a custom initial amount greater than $0." }, { status: 400 });
    }

    if (!isLaundryRescue && !useCustomInitial && !priceId) {
      return NextResponse.json(
        { ok: false, error: `Missing Stripe ${mode} price ID for this service. Check the service selection and Vercel Stripe price env vars.` },
        { status: 400 }
      );
    }

    const email = getString(data.email);
    const fullName = getString(data.fullName);
    const phone = getString(data.phone);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const laundryDepositAmount = getLaundryDepositAmount(mode, customAmount, useCustomInitial);
    const laundryDepositAmountCents = moneyToCents(laundryDepositAmount);
    const lineItems = isLaundryRescue
      ? [
          {
            price_data: {
              currency: "usd",
              unit_amount: laundryDepositAmountCents,
              tax_behavior: "exclusive" as const,
              product_data: {
                tax_code: laundryProductTaxCode,
                name: useCustomInitial ? customTitle : "Laundry Rescue non-refundable deposit / minimum",
                description: [
                  customNote || "Non-refundable Laundry Rescue deposit/minimum. This amount is credited toward the final laundry total after dry weight, add-ons, bulky items, or approved changes are reviewed.",
                  "Final balance is handled after dry weigh-in. The customer chooses auto-charge or invoice-before-delivery during checkout.",
                ].filter(Boolean).join("\n"),
              },
            },
            quantity: 1,
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
                  description: [customNote || `${serviceTitle} — ${formatMoney(customAmount)}`, servicePeriodLabel ? `Service period: ${servicePeriodLabel}` : ""].filter(Boolean).join("\n"),
                },
              },
              quantity: 1,
            },
          ]
        : [{ price: priceId, quantity: 1 }];

    const successPaymentType = isLaundryRescue ? "laundry_deposit" : useCustomInitial ? "custom_initial" : "service_payment";
    const checkoutParams: any = {
      mode: "payment",
      line_items: lineItems,
      automatic_tax: { enabled: enableAutomaticTax && (isLaundryRescue || (isCommercialReset && useCustomInitial && commercialBreakdownHasTaxableLines(savedCommercialBreakdown))) },
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
        paymentMode: useCustomInitial ? "custom" : mode,
        paymentType: isLaundryRescue ? "laundry_deposit" : "service_payment",
        customInitialPayment: useCustomInitial ? "true" : "false",
        customInitialTitle: useCustomInitial ? customTitle : "",
        customInitialNote: useCustomInitial ? customNote : "",
        customInitialAmount: useCustomInitial ? String(Number(customAmount.toFixed(2))) : "",
        laundryDepositNonRefundable: isLaundryRescue ? "true" : "",
        laundryDepositAmount: isLaundryRescue ? String(Number(laundryDepositAmount.toFixed(2))) : "",
        laundryFinalPaymentOptions: isLaundryRescue ? "auto_charge_or_invoice_before_delivery" : "",
        taxHandling: isLaundryRescue
          ? "taxable_laundry_rescue"
          : isCommercialReset && useCustomInitial && commercialBreakdownHasTaxableLines(savedCommercialBreakdown)
            ? "taxable_commercial_specialty"
            : "nontaxable_default",
        servicePeriodLabel,
        servicePeriodStart: isCommercialReset ? getString(savedCommercialBreakdown.servicePeriodStart) : getString(savedFamilyBreakdown.servicePeriodStart),
        servicePeriodEnd: isCommercialReset ? getString(savedCommercialBreakdown.servicePeriodEnd) : getString(savedFamilyBreakdown.servicePeriodEnd),
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
      },
    };

    if (isLaundryRescue) {
      checkoutParams.customer_creation = "always";
      checkoutParams.payment_method_types = ["card"];
      checkoutParams.payment_intent_data = { setup_future_usage: "off_session" };
      checkoutParams.custom_fields = buildLaundryFinalPaymentCustomFields();
      checkoutParams.custom_text = {
        submit: {
          message:
            "Laundry Rescue deposit/minimum is non-refundable and credited toward the final total. If you choose auto-charge, NestHelper may charge your saved payment method for the final balance after dry weight and add-ons are confirmed. If you choose invoice-before-delivery, laundry is held until the final invoice is fully paid.",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(checkoutParams as any);

    const checkoutUrl = session.url || "";
    const replyToEmail = isLaundryRescue ? emailAliases.laundry : isCommercialReset ? emailAliases.commercial : emailAliases.billing;
    const servicePrice = isLaundryRescue
      ? `${formatMoney(laundryDepositAmount)} non-refundable deposit/minimum + tax, credited toward the final laundry total`
      : useCustomInitial
        ? `${formatMoney(customAmount)} custom initial checkout`
        : getServicePriceLabel(serviceId, mode);
    let emailSent = false;
    let emailError = "";

    if (shouldSendEmail && email && checkoutUrl) {
      try {
        await sendPaymentLinkEmail({
          to: email,
          customerName: fullName,
          requestId,
          serviceTitle: useCustomInitial ? customTitle : serviceTitle,
          servicePrice,
          paymentUrl: checkoutUrl,
          preferredDate: getString(data.preferredDate),
          preferredWindow: getString(data.preferredWindow),
          city: getString(data.city),
          replyToEmail,
          quoteBreakdownText: isLaundryRescue
            ? "This deposit/minimum is non-refundable and is credited toward the final Laundry Rescue total. During Stripe checkout, the customer chooses either auto-charge for the final balance after dry weigh-in or invoice-before-delivery. Laundry is not released until the final balance is fully paid."
            : isCommercialReset && useCustomInitial && shouldIncludeQuoteBreakdown
              ? savedCommercialBreakdownText
              : !isCommercialReset && shouldIncludeFamilyBreakdown
                ? savedFamilyBreakdownText
                : "",
          quoteBreakdownTitle: isLaundryRescue
            ? "Laundry Rescue deposit and final-balance choice"
            : isCommercialReset
              ? "Commercial Reset quote breakdown"
              : savedFamilyBreakdownText
                ? "NestHelper payment breakdown"
                : undefined,
        });
        emailSent = true;
      } catch (error) {
        console.error("Payment link email failed", error);
        emailError = "Checkout link was created, but the email failed. Copy and send the link manually.";
      }
    }

    const updatePayload: Record<string, unknown> = {
      status: isLaundryRescue ? "Deposit Checkout Sent" : "Checkout Sent",
      paymentStatus: isLaundryRescue ? "Deposit Checkout Sent" : "Checkout Sent",
      laundryPaymentStatus: isLaundryRescue ? "Deposit Checkout Sent" : data.laundryPaymentStatus || null,
      paymentMode: useCustomInitial ? "custom" : mode,
      checkoutUrl,
      checkoutSessionId: session.id,
      stripePriceId: priceId || null,
      checkoutCreatedAt: FieldValue.serverTimestamp(),
      checkoutSentAt: emailSent ? FieldValue.serverTimestamp() : null,
      checkoutEmailSent: emailSent,
      checkoutEmailError: emailError,
      checkoutIncludedQuoteBreakdown: Boolean(isCommercialReset && useCustomInitial && shouldIncludeQuoteBreakdown && savedCommercialBreakdownText),
      checkoutIncludedFamilyBreakdown: Boolean(!isCommercialReset && shouldIncludeFamilyBreakdown && savedFamilyBreakdownText),
      laundryDepositNonRefundable: isLaundryRescue ? true : data.laundryDepositNonRefundable || null,
      laundryDepositExpectedAmount: isLaundryRescue ? Number(laundryDepositAmount.toFixed(2)) : data.laundryDepositExpectedAmount || null,
      laundryDepositExpectedAmountCents: isLaundryRescue ? laundryDepositAmountCents : data.laundryDepositExpectedAmountCents || null,
      laundryFinalPaymentPreferenceRequired: isLaundryRescue ? true : data.laundryFinalPaymentPreferenceRequired || null,
      checkoutServicePeriodLabel: servicePeriodLabel,
      checkoutServicePeriodStart: isCommercialReset ? getString(savedCommercialBreakdown.servicePeriodStart) : getString(savedFamilyBreakdown.servicePeriodStart),
      checkoutServicePeriodEnd: isCommercialReset ? getString(savedCommercialBreakdown.servicePeriodEnd) : getString(savedFamilyBreakdown.servicePeriodEnd),
      checkoutCreatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    if (useCustomInitial) {
      updatePayload.customInitialPayment = true;
      updatePayload.customInitialAmount = Number(customAmount.toFixed(2));
      updatePayload.customInitialAmountCents = customAmountCents;
      updatePayload.customInitialTitle = customTitle;
      updatePayload.customInitialNote = customNote;
      updatePayload.customInitialCheckoutUrl = checkoutUrl;
      updatePayload.customInitialCheckoutSessionId = session.id;
    }

    await requestRef.update(updatePayload);

    return NextResponse.json({
      ok: true,
      url: checkoutUrl,
      sessionId: session.id,
      emailSent,
      emailError,
      customInitial: useCustomInitial,
      includedQuoteBreakdown: Boolean(isCommercialReset && useCustomInitial && shouldIncludeQuoteBreakdown && savedCommercialBreakdownText),
      includedFamilyBreakdown: Boolean(!isCommercialReset && shouldIncludeFamilyBreakdown && savedFamilyBreakdownText),
    });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Unable to create payment link.";
    console.error("Create payment link failed", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
