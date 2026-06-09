import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { emailAliases } from "@/lib/emailRouting";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { services } from "@/lib/services";
import { sendAdditionalPaymentLinkEmail } from "@/lib/sendAdditionalPaymentLinkEmail";
import { getManualSalesTaxFirestoreFields, getManualSalesTaxMetadata, getOrCreateManualSalesTaxRate, manualTaxRatesParam, resolveManualSalesTaxConfig } from "@/lib/stripeManualTax";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const nontaxableProductTaxCode = (process.env.STRIPE_NONTAXABLE_TAX_CODE || "txcd_00000000").trim();
const laundryProductTaxCode = (process.env.STRIPE_LAUNDRY_TAX_CODE || process.env.STRIPE_PRODUCT_TAX_CODE || process.env.STRIPE_TAX_CODE || "txcd_20090012").trim();
const commercialCleaningTaxCode = (process.env.STRIPE_COMMERCIAL_CLEANING_TAX_CODE || "txcd_20010004").trim();

type AdditionalPaymentBody = {
  requestId?: string;
  amount?: number | string;
  reason?: string;
  note?: string;
  sendEmail?: boolean;
  manualSalesTax?: boolean | string;
  manualSalesTaxRate?: number | string;
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

function getServiceTitle(data: Record<string, unknown>) {
  const serviceId = getString(data.service);
  return getString(data.selectedServiceTitle) || services.find((item) => item.id === serviceId)?.title || serviceId || "NestHelper service";
}

function getAdditionalPaymentReplyEmail(serviceId: string) {
  if (serviceId === "commercial-reset") return emailAliases.commercial;
  return serviceId === "laundry-rescue" ? emailAliases.laundry : emailAliases.billing;
}

function getAdditionalPaymentTaxCode(serviceId: string) {
  if (serviceId === "laundry-rescue") return laundryProductTaxCode;
  if (serviceId === "commercial-reset") return commercialCleaningTaxCode;
  return nontaxableProductTaxCode;
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

    const body = (await request.json().catch(() => null)) as AdditionalPaymentBody | null;
    const requestId = getString(body?.requestId);
    const amount = cleanNumber(body?.amount);
    const amountCents = moneyToCents(amount);
    const reason = getString(body?.reason) || "Additional approved balance";
    const note = getString(body?.note);
    const shouldSendEmail = body?.sendEmail !== false;
    const manualSalesTax = resolveManualSalesTaxConfig({ enabled: body?.manualSalesTax, rate: body?.manualSalesTaxRate });

    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });
    if (amountCents <= 0) return NextResponse.json({ ok: false, error: "Enter an additional payment amount greater than $0." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });

    const data = requestSnap.data() || {};
    const serviceId = getString(data.service);
    const serviceTitle = getServiceTitle(data);
    const email = getString(data.email);
    const fullName = getString(data.fullName);
    const replyToEmail = getAdditionalPaymentReplyEmail(serviceId);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const manualSalesTaxRateId = await getOrCreateManualSalesTaxRate(stripe, manualSalesTax, { requestId, serviceId, paymentType: "additional_payment" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            tax_behavior: "exclusive",
            product_data: {
              tax_code: getAdditionalPaymentTaxCode(serviceId),
              name: "NestHelper additional balance",
              description: `${reason} — ${formatMoney(amount)}`,
            },
          },
          quantity: 1,
          ...manualTaxRatesParam(manualSalesTaxRateId),
        },
      ],
      automatic_tax: { enabled: false },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      allow_promotion_codes: false,
      customer_email: email || undefined,
      client_reference_id: requestId,
      success_url: `${siteUrl}/checkout?success=true&payment_type=additional_payment&service_id=${encodeURIComponent(serviceId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=true&payment_type=additional_payment&service_id=${encodeURIComponent(serviceId)}&request_id=${requestId}`,
      metadata: {
        requestId,
        serviceId,
        serviceTitle,
        paymentType: "additional_payment",
        additionalReason: reason,
        additionalNote: note,
        additionalAmount: String(Number(amount.toFixed(2))),
        customerName: fullName,
        customerEmail: email,
        ...getManualSalesTaxMetadata(manualSalesTax, manualSalesTaxRateId),
      },
    });

    const checkoutUrl = session.url || "";
    let emailSent = false;
    let emailError = "";

    if (shouldSendEmail && email && checkoutUrl) {
      try {
        await sendAdditionalPaymentLinkEmail({
          to: email,
          customerName: fullName,
          requestId,
          serviceTitle,
          paymentUrl: checkoutUrl,
          amount,
          reason,
          note,
          preferredDate: getString(data.preferredDate),
          preferredWindow: getString(data.preferredWindow),
          city: getString(data.city),
          replyToEmail,
        });
        emailSent = true;
      } catch (error) {
        console.error("Additional payment link email failed", error);
        emailError = "Additional payment link was created, but the email failed. Copy and send the link manually.";
      }
    }

    await requestRef.update({
      status: "Additional Payment Sent",
      paymentStatus: "Additional Payment Sent",
      additionalPaymentStatus: "Additional Payment Sent",
      additionalPaymentAmount: Number(amount.toFixed(2)),
      additionalPaymentAmountCents: amountCents,
      additionalPaymentReason: reason,
      additionalPaymentNote: note,
      additionalPaymentCheckoutUrl: checkoutUrl,
      additionalPaymentCheckoutSessionId: session.id,
      additionalPaymentSentAt: emailSent ? FieldValue.serverTimestamp() : null,
      additionalPaymentEmailSent: emailSent,
      additionalPaymentEmailError: emailError,
      additionalPaymentCreatedAt: FieldValue.serverTimestamp(),
      additionalPaymentCreatedBy: decoded.email || "admin",
      additionalPaymentTaxMode: manualSalesTax.enabled ? "Manual sales tax" : "No sales tax",
      ...getManualSalesTaxFirestoreFields(manualSalesTax, manualSalesTaxRateId),
      additionalPaymentHistory: FieldValue.arrayUnion({
        type: "sent",
        amountCents,
        amount: Number(amount.toFixed(2)),
        reason,
        note,
        checkoutSessionId: session.id,
        checkoutUrl,
        emailSent,
        emailError,
        createdBy: decoded.email || "admin",
        manualSalesTaxEnabled: manualSalesTax.enabled,
        manualSalesTaxRate: manualSalesTax.enabled ? manualSalesTax.rate : 0,
        manualSalesTaxRateId,
        createdAtIso: new Date().toISOString(),
      }),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    });

    return NextResponse.json({ ok: true, url: checkoutUrl, sessionId: session.id, emailSent, emailError, amount, manualSalesTaxEnabled: manualSalesTax.enabled, manualSalesTaxRate: manualSalesTax.rate });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error && error.message ? error.message : "Unable to create additional payment link.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
