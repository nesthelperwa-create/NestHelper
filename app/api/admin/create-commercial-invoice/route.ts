import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { sendCommercialInvoiceEmail } from "@/lib/sendCommercialInvoiceEmail";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const enableAutomaticTax = process.env.ENABLE_STRIPE_AUTOMATIC_TAX !== "false";
const nontaxableProductTaxCode = (process.env.STRIPE_NONTAXABLE_TAX_CODE || "txcd_00000000").trim();
const commercialCleaningTaxCode = (process.env.STRIPE_COMMERCIAL_CLEANING_TAX_CODE || "txcd_20010004").trim();

type CreateCommercialInvoiceBody = {
  requestId?: string;
  sendEmail?: boolean;
};

type AddressResult = {
  address?: Stripe.AddressParam;
  sourceText: string;
  hasUsableLocation: boolean;
  missingReason?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatServicePeriodLabel(start: unknown, end: unknown) {
  const cleanStart = getString(start);
  const cleanEnd = getString(end);
  if (cleanStart && cleanEnd) return `${cleanStart} to ${cleanEnd}`;
  if (cleanStart) return `Starts ${cleanStart}`;
  if (cleanEnd) return `Through ${cleanEnd}`;
  return "";
}

function cleanNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function moneyToCents(value: unknown) {
  return Math.round(Math.max(0, cleanNumber(value)) * 100);
}

function pickFirstString(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getString(data[key]);
    if (value) return value;
  }
  return "";
}

function extractZipFromText(text: string) {
  const match = text.match(/\b\d{5}(?:-\d{4})?\b/);
  return match?.[0] || "";
}

function extractStateFromText(text: string) {
  const upper = text.toUpperCase();
  if (/\bWA\b/.test(upper) || upper.includes("WASHINGTON")) return "WA";
  return "";
}

function getCommercialAddress(data: Record<string, unknown>): AddressResult {
  const possibleAddressText = pickFirstString(data, [
    "serviceAddress",
    "cleaningAddress",
    "commercialAddress",
    "businessAddress",
    "jobAddress",
    "propertyAddress",
    "address",
    "streetAddress",
    "location",
    "serviceLocation",
    "commercialServiceAddress",
  ]);

  const line1 =
    pickFirstString(data, [
      "serviceAddressLine1",
      "cleaningAddressLine1",
      "commercialAddressLine1",
      "businessAddressLine1",
      "jobAddressLine1",
      "propertyAddressLine1",
      "addressLine1",
      "streetAddress",
    ]) || possibleAddressText;

  const city = pickFirstString(data, [
    "serviceCity",
    "cleaningCity",
    "commercialCity",
    "businessCity",
    "jobCity",
    "propertyCity",
    "city",
  ]);

  const state =
    pickFirstString(data, [
      "serviceState",
      "cleaningState",
      "commercialState",
      "businessState",
      "jobState",
      "propertyState",
      "state",
    ]) ||
    extractStateFromText(possibleAddressText) ||
    "WA";

  const postal_code =
    pickFirstString(data, [
      "serviceZip",
      "serviceZipCode",
      "servicePostalCode",
      "cleaningZip",
      "cleaningZipCode",
      "commercialZip",
      "commercialZipCode",
      "commercialPostalCode",
      "businessZip",
      "businessZipCode",
      "jobZip",
      "jobZipCode",
      "propertyZip",
      "propertyZipCode",
      "zip",
      "zipCode",
      "postalCode",
    ]) || extractZipFromText(possibleAddressText);

  const sourceText = [line1, city, state, postal_code].filter(Boolean).join(", ");

  if (!line1 && !city && !postal_code) {
    return {
      sourceText,
      hasUsableLocation: false,
      missingReason:
        "The commercial request does not have a service address. Add the business/service address with city, state, and ZIP before creating a taxable commercial invoice.",
    };
  }

  if (!postal_code) {
    return {
      address: {
        line1: line1 || undefined,
        city: city || undefined,
        state: state || "WA",
        country: "US",
      },
      sourceText,
      hasUsableLocation: false,
      missingReason:
        "The commercial request is missing a ZIP code. Stripe Tax needs a customer/service ZIP code to calculate sales tax on taxable commercial lines.",
    };
  }

  return {
    address: {
      line1: line1 || undefined,
      city: city || undefined,
      state: state || "WA",
      postal_code,
      country: "US",
    },
    sourceText,
    hasUsableLocation: true,
  };
}

function formatRateForInvoice(rate: string, unit: string) {
  if (!rate) return "";
  const normalizedUnit = unit.toLowerCase();
  const rateNumber = cleanNumber(rate);
  if (!Number.isFinite(rateNumber) || rateNumber <= 0) return rate;

  if (
    normalizedUnit.includes("sq ft") ||
    normalizedUnit.includes("hour") ||
    normalizedUnit.includes("area") ||
    normalizedUnit.includes("turnover") ||
    normalizedUnit.includes("set")
  ) {
    return `$${rateNumber.toLocaleString("en-US", {
      minimumFractionDigits: rateNumber < 10 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${rateNumber.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildLineDescription(line: Record<string, unknown>, servicePeriodLabel = "") {
  const label = getString(line.label) || "Commercial Reset line item";
  const description = getString(line.description);
  const note = getString(line.note);
  const quantity = getString(line.quantity);
  const unit = getString(line.unit);
  const rate = getString(line.rate);
  const minimum = getString(line.minimum);
  const multiplier = getString(line.multiplier);
  const multiplierLabel = getString(line.multiplierLabel);

  const isFlat = !unit || unit === "flat";
  const math = isFlat
    ? "Flat approved amount"
    : `Calculation: ${quantity || "0"} ${unit} × ${formatRateForInvoice(rate, unit)}${
        multiplier && multiplier !== "1" ? ` × ${multiplier} ${multiplierLabel || "multiplier"}` : ""
      }`;

  const minimumText =
    !isFlat && minimum && cleanNumber(minimum) > 0
      ? `Minimum: $${cleanNumber(minimum).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      : "";

  return [
    label,
    servicePeriodLabel ? `Service period: ${servicePeriodLabel}` : "",
    description ? `Scope: ${description}` : "",
    math,
    minimumText,
    note ? `Note: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 900);
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

function getCommercialLineTaxMode(line: Record<string, unknown>): "taxable" | "nontaxable" {
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
  if (
    /\b(carpet|deep clean|deep-clean|first[-\s]?time|floor scrub|buff|shine|wax|strip|turnover|linen|restock|specialty|specialized|non[-\s]?repetitive)\b/.test(
      searchable
    )
  ) {
    return "taxable";
  }

  return "nontaxable";
}

function getCommercialTaxCounts(lineItems: Record<string, unknown>[]): { taxable: number; nontaxable: number } {
  return lineItems.reduce<{ taxable: number; nontaxable: number }>(
    (counts, line) => {
      if (getCommercialLineTaxMode(line) === "taxable") counts.taxable += 1;
      else counts.nontaxable += 1;
      return counts;
    },
    { taxable: 0, nontaxable: 0 }
  );
}

function getAutomaticTaxStatus(invoice: Stripe.Invoice) {
  const automaticTax = invoice.automatic_tax as Stripe.Invoice.AutomaticTax | null | undefined;
  return automaticTax?.status || "";
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    if (!stripe) {
      return NextResponse.json(
        { ok: false, error: "Stripe is not configured. Add STRIPE_SECRET_KEY in Vercel." },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => null)) as CreateCommercialInvoiceBody | null;
    const requestId = getString(body?.requestId);
    const shouldSendEmail = body?.sendEmail !== false;

    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });
    }

    const data = requestSnap.data() || {};
    if (getString(data.service) !== "commercial-reset") {
      return NextResponse.json(
        { ok: false, error: "This invoice tool is only for Commercial Reset requests." },
        { status: 400 }
      );
    }

    const email = getString(data.email);
    if (!email) return NextResponse.json({ ok: false, error: "Customer email is missing." }, { status: 400 });

    const breakdown = (data.commercialQuoteBreakdown || {}) as Record<string, unknown>;
    const lineItems = Array.isArray(breakdown.lineItems) ? (breakdown.lineItems as Record<string, unknown>[]) : [];
    const amountDueNowCents = moneyToCents(breakdown.amountDueNow);
    const commercialTaxCounts = getCommercialTaxCounts(lineItems);
    const hasTaxableCommercialLines = commercialTaxCounts.taxable > 0;
    const commercialAddress = getCommercialAddress(data);

    if (!lineItems.length || amountDueNowCents <= 0) {
      return NextResponse.json(
        { ok: false, error: "Save a commercial quote breakdown with an amount due now before creating an invoice." },
        { status: 400 }
      );
    }

    if (hasTaxableCommercialLines && !commercialAddress.hasUsableLocation) {
      return NextResponse.json(
        {
          ok: false,
          error:
            commercialAddress.missingReason ||
            "This quote has taxable commercial lines, but the request is missing a complete service address for Stripe Tax.",
        },
        { status: 400 }
      );
    }

    const customerName =
      getString(data.fullName) ||
      getString(data.contactName) ||
      getString(data.businessName) ||
      "NestHelper customer";

    const customer = await stripe.customers.create({
      email,
      name: customerName,
      phone: getString(data.phone) || undefined,
      address: commercialAddress.address,
      shipping: commercialAddress.address
        ? {
            name: customerName,
            phone: getString(data.phone) || undefined,
            address: commercialAddress.address,
          }
        : undefined,
      metadata: {
        requestId,
        serviceId: "commercial-reset",
        serviceAddress: commercialAddress.sourceText,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const servicePeriodLabel = formatServicePeriodLabel(breakdown.servicePeriodStart, breakdown.servicePeriodEnd);

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 7,
      automatic_tax: { enabled: enableAutomaticTax && hasTaxableCommercialLines },
      auto_advance: false,
      description: getString(breakdown.quoteTitle) || "NestHelper Commercial Reset invoice",
      footer:
        getString(breakdown.customerNote) ||
        "Final service is based on approved scope, access, condition, schedule, and reviewed add-ons.",
      metadata: {
        requestId,
        serviceId: "commercial-reset",
        paymentType: "commercial_invoice",
        servicePeriodStart: getString(breakdown.servicePeriodStart),
        servicePeriodEnd: getString(breakdown.servicePeriodEnd),
        servicePeriodLabel,
        taxHandling: hasTaxableCommercialLines ? "mixed_or_taxable_commercial_lines" : "nontaxable_routine_janitorial",
        serviceAddress: commercialAddress.sourceText,
        siteUrl,
      },
    });

    let attachedLineCount = 0;

    for (const line of lineItems) {
      const amount = moneyToCents(line.amount);
      if (amount <= 0) continue;

      const taxMode = getCommercialLineTaxMode(line);

      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        currency: "usd",
        amount,
        tax_behavior: "exclusive",
        tax_code: taxMode === "taxable" ? commercialCleaningTaxCode : nontaxableProductTaxCode,
        description: buildLineDescription(line, servicePeriodLabel),
        metadata: {
          requestId,
          serviceId: "commercial-reset",
          preset: getString(line.preset),
          lineLabel: getString(line.label) || "Commercial Reset line item",
          taxMode,
        },
      });

      attachedLineCount += 1;
    }

    const discountCredit = moneyToCents(breakdown.discountCredit);
    if (discountCredit > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        currency: "usd",
        amount: -discountCredit,
        description: "Discount / credit\nApplied from the approved NestHelper Commercial Reset quote breakdown.",
        metadata: {
          requestId,
          serviceId: "commercial-reset",
          taxMode: "credit",
        },
      });

      attachedLineCount += 1;
    }

    if (attachedLineCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No billable invoice line items were attached. Save a quote breakdown with at least one positive line item before creating an invoice.",
        },
        { status: 400 }
      );
    }

    let finalized = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });

    const taxStatus = getAutomaticTaxStatus(finalized);
    if (hasTaxableCommercialLines && enableAutomaticTax && taxStatus && taxStatus !== "complete") {
      await requestRef.update({
        commercialInvoiceId: finalized.id,
        commercialInvoiceNumber: finalized.number || "",
        commercialInvoiceTaxStatus: taxStatus,
        commercialInvoiceTaxWarning: `Stripe automatic tax status: ${taxStatus}. Check the service address, Stripe Tax registration, and tax code settings.`,
        commercialInvoiceCreatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: decoded.email || "admin",
      });

      return NextResponse.json(
        {
          ok: false,
          error: `Stripe created the invoice, but automatic tax did not complete. Stripe tax status: ${taxStatus}. Check the commercial service address, ZIP code, live/test tax registration, and tax code settings before sending this invoice.`,
          invoiceId: finalized.id,
          invoiceNumber: finalized.number,
          taxStatus,
        },
        { status: 500 }
      );
    }

    const hostedInvoiceUrl = finalized.hosted_invoice_url || "";
    const invoicePdf = finalized.invoice_pdf || "";

    if ((finalized.amount_due ?? 0) <= 0) {
      await requestRef.update({
        commercialInvoiceId: finalized.id,
        commercialInvoiceNumber: finalized.number || "",
        commercialInvoiceUrl: hostedInvoiceUrl,
        commercialInvoicePdf: invoicePdf,
        commercialInvoiceAmountDue: finalized.amount_due ?? null,
        commercialInvoiceEmailWarning:
          "Stripe finalized this invoice at $0.00, so NestHelper did not email it. Review the saved quote line items and try again.",
        commercialInvoiceTaxStatus: taxStatus,
        commercialInvoiceCreatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: decoded.email || "admin",
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Stripe finalized the invoice at $0.00. The invoice link was not emailed. Reopen the quote builder, confirm the line items, save the quote, and create the invoice again.",
        },
        { status: 500 }
      );
    }

    if (!hostedInvoiceUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Stripe created the invoice, but no hosted invoice link was returned. Open the invoice in Stripe or try again.",
        },
        { status: 500 }
      );
    }

    let emailSent = false;
    let emailWarning = "";

    if (shouldSendEmail) {
      try {
        const result = (await sendCommercialInvoiceEmail({
          to: email,
          customerName,
          requestId,
          invoiceUrl: hostedInvoiceUrl,
          invoicePdf,
          invoiceNumber: finalized.number,
          amountDueCents: finalized.amount_due,
          dueDate: finalized.due_date,
          quoteTitle: getString(breakdown.quoteTitle) || "Commercial Reset quote breakdown",
          quoteBreakdownText: getString(breakdown.customerBreakdownText),
        })) as any;

        if (result?.skipped) {
          emailWarning =
            "Invoice created, but the NestHelper email was skipped because email settings or the customer email are missing.";
        } else if (result?.error) {
          emailWarning = result.error?.message || "Invoice created, but the NestHelper email could not be sent.";
        } else {
          emailSent = true;
        }
      } catch (emailError: any) {
        console.error("Commercial invoice NestHelper email failed", emailError);
        emailWarning = emailError?.message || "Invoice created, but the NestHelper email could not be sent.";
      }
    }

    const nextStatus = shouldSendEmail && emailSent ? "Invoice Link Sent" : "Invoice Created";

    await requestRef.update({
      status: nextStatus,
      paymentStatus: nextStatus,
      commercialInvoiceId: finalized.id,
      commercialInvoiceNumber: finalized.number || "",
      commercialInvoiceUrl: hostedInvoiceUrl,
      commercialInvoicePdf: invoicePdf,
      commercialInvoiceAmountDue: finalized.amount_due ?? null,
      commercialInvoiceServicePeriodStart: getString(breakdown.servicePeriodStart),
      commercialInvoiceServicePeriodEnd: getString(breakdown.servicePeriodEnd),
      commercialInvoiceServicePeriodLabel: servicePeriodLabel,
      commercialInvoiceCustomerId: customer.id,
      commercialInvoiceTaxHandling: hasTaxableCommercialLines
        ? "Stripe automatic tax for taxable Commercial Reset lines; nontaxable tax code for routine janitorial lines"
        : "No sales tax applied by NestHelper for routine/repetitive janitorial-style Commercial Reset lines",
      commercialInvoiceTaxStatus: taxStatus,
      commercialInvoiceServiceAddress: commercialAddress.sourceText,
      commercialInvoiceTaxableLineCount: commercialTaxCounts.taxable,
      commercialInvoiceNontaxableLineCount: commercialTaxCounts.nontaxable,
      commercialInvoiceDeliveryMethod: shouldSendEmail ? "nesthelper_email" : "manual",
      commercialInvoiceEmailSent: emailSent,
      commercialInvoiceEmailWarning: emailWarning,
      commercialInvoiceCreatedAt: FieldValue.serverTimestamp(),
      commercialInvoiceSentAt: shouldSendEmail && emailSent ? FieldValue.serverTimestamp() : null,
      commercialInvoiceCreatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    });

    return NextResponse.json({
      ok: true,
      invoiceId: finalized.id,
      invoiceNumber: finalized.number,
      customerId: customer.id,
      hostedInvoiceUrl,
      invoicePdf,
      emailSent,
      emailWarning,
      status: nextStatus,
      paymentStatus: nextStatus,
      deliveryMethod: shouldSendEmail ? "nesthelper_email" : "manual",
      taxableLineCount: commercialTaxCounts.taxable,
      nontaxableLineCount: commercialTaxCounts.nontaxable,
      taxStatus,
      serviceAddress: commercialAddress.sourceText,
    });
  } catch (error: any) {
    console.error("Unable to create commercial invoice", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to create commercial invoice." },
      { status: 500 }
    );
  }
}