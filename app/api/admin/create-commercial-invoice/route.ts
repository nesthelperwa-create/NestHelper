import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const enableAutomaticTax = process.env.ENABLE_STRIPE_AUTOMATIC_TAX === "true";

type CreateCommercialInvoiceBody = {
  requestId?: string;
  sendEmail?: boolean;
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

function getAddress(data: Record<string, unknown>): Stripe.AddressParam | undefined {
  const line1 = getString(data.serviceAddress) || getString(data.address) || getString(data.streetAddress);
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

function buildLineDescription(line: Record<string, unknown>) {
  const description = getString(line.description);
  const note = getString(line.note);
  const quantity = getString(line.quantity);
  const unit = getString(line.unit);
  const rate = getString(line.rate);
  const multiplier = getString(line.multiplier);
  const multiplierLabel = getString(line.multiplierLabel);
  const math = unit && unit !== "flat" ? `${quantity} ${unit} × ${rate}${multiplier && multiplier !== "1" ? ` × ${multiplier} ${multiplierLabel || "multiplier"}` : ""}` : "Flat approved amount";
  return [description, math, note ? `Note: ${note}` : ""].filter(Boolean).join("\n").slice(0, 500);
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) return NextResponse.json({ ok: false }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false }, { status: 403 });

    if (!stripe) {
      return NextResponse.json({ ok: false, error: "Stripe is not configured. Add STRIPE_SECRET_KEY in Vercel." }, { status: 500 });
    }

    const body = (await request.json().catch(() => null)) as CreateCommercialInvoiceBody | null;
    const requestId = getString(body?.requestId);
    const shouldSendEmail = body?.sendEmail !== false;

    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });

    const data = requestSnap.data() || {};
    if (getString(data.service) !== "commercial-reset") {
      return NextResponse.json({ ok: false, error: "This invoice tool is only for Commercial Reset requests." }, { status: 400 });
    }

    const email = getString(data.email);
    if (!email) return NextResponse.json({ ok: false, error: "Customer email is missing." }, { status: 400 });

    const breakdown = (data.commercialQuoteBreakdown || {}) as Record<string, unknown>;
    const lineItems = Array.isArray(breakdown.lineItems) ? breakdown.lineItems as Record<string, unknown>[] : [];
    const amountDueNowCents = moneyToCents(breakdown.amountDueNow);

    if (!lineItems.length || amountDueNowCents <= 0) {
      return NextResponse.json({ ok: false, error: "Save a commercial quote breakdown with an amount due now before creating an invoice." }, { status: 400 });
    }

    const customerName = getString(data.fullName) || getString(data.contactName) || getString(data.businessName) || "NestHelper customer";
    const address = getAddress(data);
    const customer = await stripe.customers.create({
      email,
      name: customerName,
      phone: getString(data.phone) || undefined,
      address,
      metadata: { requestId, serviceId: "commercial-reset" },
    });

    for (const line of lineItems) {
      const amount = moneyToCents(line.amount);
      if (amount <= 0) continue;
      await stripe.invoiceItems.create({
        customer: customer.id,
        currency: "usd",
        amount,
        description: getString(line.label) || "Commercial Reset line item",
        metadata: {
          requestId,
          serviceId: "commercial-reset",
          preset: getString(line.preset),
          lineDescription: buildLineDescription(line),
        },
      });
    }

    const discountCredit = moneyToCents(breakdown.discountCredit);
    if (discountCredit > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        currency: "usd",
        amount: -discountCredit,
        description: "Discount / credit",
        metadata: { requestId, serviceId: "commercial-reset" },
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 7,
      automatic_tax: { enabled: enableAutomaticTax },
      description: getString(breakdown.quoteTitle) || "NestHelper Commercial Reset invoice",
      footer: getString(breakdown.customerNote) || "Final service is based on approved scope, access, condition, schedule, and reviewed add-ons.",
      metadata: {
        requestId,
        serviceId: "commercial-reset",
        paymentType: "commercial_invoice",
        siteUrl,
      },
    });

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    const sentInvoice = shouldSendEmail ? await stripe.invoices.sendInvoice(finalized.id) : finalized;

    const hostedInvoiceUrl = sentInvoice.hosted_invoice_url || finalized.hosted_invoice_url || "";
    const invoicePdf = sentInvoice.invoice_pdf || finalized.invoice_pdf || "";

    await requestRef.update({
      status: shouldSendEmail ? "Invoice Sent" : "Invoice Created",
      paymentStatus: shouldSendEmail ? "Invoice Sent" : "Invoice Created",
      commercialInvoiceId: finalized.id,
      commercialInvoiceUrl: hostedInvoiceUrl,
      commercialInvoicePdf: invoicePdf,
      commercialInvoiceAmountDue: finalized.amount_due ?? null,
      commercialInvoiceCustomerId: customer.id,
      commercialInvoiceCreatedAt: FieldValue.serverTimestamp(),
      commercialInvoiceSentAt: shouldSendEmail ? FieldValue.serverTimestamp() : null,
      commercialInvoiceCreatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    });

    return NextResponse.json({ ok: true, invoiceId: finalized.id, customerId: customer.id, hostedInvoiceUrl, invoicePdf, emailSent: shouldSendEmail });
  } catch (error: any) {
    console.error("Unable to create commercial invoice", error);
    return NextResponse.json({ ok: false, error: error?.message || "Unable to create commercial invoice." }, { status: 500 });
  }
}
