import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { services } from "@/lib/services";
import { emailAliases } from "@/lib/emailRouting";
import { sendFamilyInvoiceEmail } from "@/lib/sendFamilyInvoiceEmail";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const enableAutomaticTax = process.env.ENABLE_STRIPE_AUTOMATIC_TAX === "true";

type CreateFamilyInvoiceBody = {
  requestId?: string;
  sendEmail?: boolean;
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

function getServiceTitle(data: Record<string, unknown>) {
  const serviceId = getString(data.service);
  return getString(data.selectedServiceTitle) || services.find((item) => item.id === serviceId)?.title || serviceId || "NestHelper family service";
}

function getAddress(data: Record<string, unknown>): Stripe.AddressParam | undefined {
  const line1 = getString(data.address) || getString(data.serviceAddress) || getString(data.streetAddress);
  const city = getString(data.city);
  const state = getString(data.state) || "WA";
  const postal_code = getString(data.zip) || getString(data.zipCode) || getString(data.postalCode);

  if (!line1 && !city && !postal_code) return undefined;
  return {
    line1: line1 || undefined,
    city: city || undefined,
    state: state || undefined,
    postal_code: postal_code || undefined,
    country: "US",
  };
}

function formatRateForInvoice(rate: string, unit: string) {
  if (!rate) return "";
  const rateNumber = cleanNumber(rate);
  if (!Number.isFinite(rateNumber) || rateNumber <= 0) return rate;
  return `$${rateNumber.toLocaleString("en-US", {
    minimumFractionDigits: rateNumber < 10 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function buildLineDescription(line: Record<string, unknown>, servicePeriodLabel = "") {
  const label = getString(line.label) || "NestHelper family line item";
  const description = getString(line.description);
  const note = getString(line.note);
  const quantity = getString(line.quantity);
  const unit = getString(line.unit) || "flat";
  const rate = getString(line.rate);
  const isFlat = unit.toLowerCase() === "flat";
  const math = isFlat ? "Flat approved amount" : `Calculation: ${quantity || "0"} ${unit} × ${formatRateForInvoice(rate, unit)}`;

  return [
    label,
    servicePeriodLabel ? `Service period: ${servicePeriodLabel}` : "",
    description ? `Scope: ${description}` : "",
    math,
    note ? `Note: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 900);
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

    const body = (await request.json().catch(() => null)) as CreateFamilyInvoiceBody | null;
    const requestId = getString(body?.requestId);
    const shouldSendEmail = body?.sendEmail !== false;

    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });

    const data = requestSnap.data() || {};
    if (getString(data.service) === "commercial-reset") {
      return NextResponse.json(
        { ok: false, error: "Use the Commercial Reset invoice tool for Commercial Reset requests." },
        { status: 400 }
      );
    }

    const email = getString(data.email);
    if (!email) return NextResponse.json({ ok: false, error: "Customer email is missing." }, { status: 400 });

    const breakdown = (data.familyPaymentBreakdown || {}) as Record<string, unknown>;
    const lineItems = Array.isArray(breakdown.lineItems) ? (breakdown.lineItems as Record<string, unknown>[]) : [];
    const amountDueNowCents = moneyToCents(breakdown.amountDueNow);
    const servicePeriodLabel = getString(breakdown.servicePeriodLabel) || formatServicePeriodLabel(breakdown.servicePeriodStart, breakdown.servicePeriodEnd);

    if (!lineItems.length || amountDueNowCents <= 0) {
      return NextResponse.json(
        { ok: false, error: "Save a family payment breakdown with an amount due now before creating an invoice." },
        { status: 400 }
      );
    }

    const customerName = getString(data.fullName) || getString(data.contactName) || "NestHelper customer";
    const serviceTitle = getServiceTitle(data);
    const address = getAddress(data);
    const customer = await stripe.customers.create({
      email,
      name: customerName,
      phone: getString(data.phone) || undefined,
      address,
      metadata: { requestId, serviceId: getString(data.service) || "family-service" },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 7,
      automatic_tax: { enabled: enableAutomaticTax },
      auto_advance: false,
      description: getString(breakdown.quoteTitle) || `${serviceTitle} invoice`,
      footer:
        getString(breakdown.customerNote) ||
        "Final service is based on approved scope, timing, access, and reviewed add-ons. Additional approved work may be invoiced separately.",
      metadata: {
        requestId,
        serviceId: getString(data.service) || "family-service",
        paymentType: "family_invoice",
        servicePeriodStart: getString(breakdown.servicePeriodStart),
        servicePeriodEnd: getString(breakdown.servicePeriodEnd),
        servicePeriodLabel,
        siteUrl,
      },
    });

    let attachedLineCount = 0;

    for (const line of lineItems) {
      const amount = moneyToCents(line.amount);
      if (amount <= 0) continue;
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        currency: "usd",
        amount,
        description: buildLineDescription(line, servicePeriodLabel),
        metadata: {
          requestId,
          serviceId: getString(data.service) || "family-service",
          preset: getString(line.preset),
          lineLabel: getString(line.label) || "NestHelper family line item",
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
        description: "Discount / credit\nApplied from the approved NestHelper family payment breakdown.",
        metadata: { requestId, serviceId: getString(data.service) || "family-service" },
      });
      attachedLineCount += 1;
    }

    if (attachedLineCount === 0) {
      return NextResponse.json(
        { ok: false, error: "No billable invoice line items were attached. Save a breakdown with at least one positive line item before creating an invoice." },
        { status: 400 }
      );
    }

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
    const hostedInvoiceUrl = finalized.hosted_invoice_url || "";
    const invoicePdf = finalized.invoice_pdf || "";

    if ((finalized.amount_due ?? 0) <= 0) {
      await requestRef.update({
        familyInvoiceId: finalized.id,
        familyInvoiceNumber: finalized.number || "",
        familyInvoiceUrl: hostedInvoiceUrl,
        familyInvoicePdf: invoicePdf,
        familyInvoiceAmountDue: finalized.amount_due ?? null,
        familyInvoiceEmailWarning: "Stripe finalized this family invoice at $0.00, so NestHelper did not email it. Review the saved breakdown and try again.",
        familyInvoiceCreatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: decoded.email || "admin",
      });
      return NextResponse.json({ ok: false, error: "Stripe finalized the family invoice at $0.00. The invoice link was not emailed." }, { status: 500 });
    }

    if (!hostedInvoiceUrl) {
      return NextResponse.json(
        { ok: false, error: "Stripe created the invoice, but no hosted invoice link was returned. Open the invoice in Stripe or try again." },
        { status: 500 }
      );
    }

    let emailSent = false;
    let emailWarning = "";

    if (shouldSendEmail) {
      try {
        const result = (await sendFamilyInvoiceEmail({
          to: email,
          customerName,
          requestId,
          invoiceUrl: hostedInvoiceUrl,
          invoicePdf,
          invoiceNumber: finalized.number,
          amountDueCents: finalized.amount_due,
          dueDate: finalized.due_date,
          serviceTitle,
          quoteTitle: getString(breakdown.quoteTitle) || `${serviceTitle} payment breakdown`,
          quoteBreakdownText: getString(breakdown.customerBreakdownText),
          servicePeriodLabel,
          replyToEmail: emailAliases.billing,
        })) as any;

        if (result?.skipped) {
          emailWarning = "Invoice created, but the NestHelper email was skipped because email settings or the customer email are missing.";
        } else if (result?.error) {
          emailWarning = result.error?.message || "Invoice created, but the NestHelper email could not be sent.";
        } else {
          emailSent = true;
        }
      } catch (emailError: any) {
        console.error("Family invoice NestHelper email failed", emailError);
        emailWarning = emailError?.message || "Invoice created, but the NestHelper email could not be sent.";
      }
    }

    const nextStatus = shouldSendEmail && emailSent ? "Invoice Link Sent" : "Invoice Created";

    await requestRef.update({
      status: nextStatus,
      paymentStatus: nextStatus,
      familyInvoiceId: finalized.id,
      familyInvoiceNumber: finalized.number || "",
      familyInvoiceUrl: hostedInvoiceUrl,
      familyInvoicePdf: invoicePdf,
      familyInvoiceAmountDue: finalized.amount_due ?? null,
      familyInvoiceServicePeriodStart: getString(breakdown.servicePeriodStart),
      familyInvoiceServicePeriodEnd: getString(breakdown.servicePeriodEnd),
      familyInvoiceServicePeriodLabel: servicePeriodLabel,
      familyInvoiceCustomerId: customer.id,
      familyInvoiceDeliveryMethod: shouldSendEmail ? "nesthelper_email" : "manual",
      familyInvoiceEmailSent: emailSent,
      familyInvoiceEmailWarning: emailWarning,
      familyInvoiceCreatedAt: FieldValue.serverTimestamp(),
      familyInvoiceSentAt: shouldSendEmail && emailSent ? FieldValue.serverTimestamp() : null,
      familyInvoiceCreatedBy: decoded.email || "admin",
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
      servicePeriodLabel,
      deliveryMethod: shouldSendEmail ? "nesthelper_email" : "manual",
    });
  } catch (error: any) {
    console.error("Unable to create family invoice", error);
    return NextResponse.json({ ok: false, error: error?.message || "Unable to create family invoice." }, { status: 500 });
  }
}
