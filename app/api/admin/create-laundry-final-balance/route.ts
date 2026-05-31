import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { sendLaundryFinalBalanceEmail } from "@/lib/sendLaundryFinalBalanceEmail";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const enableAutomaticTax = process.env.ENABLE_STRIPE_AUTOMATIC_TAX === "true";

type LaundryFinalBalanceBody = {
  requestId?: string;
  dryWeightLbs?: number;
  ratePerLb?: number;
  addOnsAmount?: number;
  depositCredit?: number;
  finalBalanceNote?: string;
  sendEmail?: boolean;
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

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, "") : "0";
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

function getDepositCreditFromRecord(data: Record<string, unknown>, providedDepositCredit: number) {
  if (providedDepositCredit > 0) return providedDepositCredit;

  const candidateCents = [
    cleanNumber(data.laundryDepositCreditCents),
    cleanNumber(data.laundryDepositAmountTotal),
    cleanNumber(data.depositPaidAmountTotal),
  ].find((value) => value > 0);

  if (candidateCents) return candidateCents / 100;

  const amountTotal = cleanNumber(data.amountTotal);
  const paymentStatus = getString(data.paymentStatus || data.status);
  if (amountTotal > 0 && ["Paid", "Deposit Paid"].includes(paymentStatus)) return amountTotal / 100;

  return getString(data.paymentMode) === "founding" ? 49 : 59;
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

    const body = (await request.json().catch(() => null)) as LaundryFinalBalanceBody | null;
    const requestId = getString(body?.requestId);
    const dryWeightLbs = cleanNumber(body?.dryWeightLbs);
    const ratePerLb = cleanNumber(body?.ratePerLb) || 2.99;
    const addOnsAmount = Math.max(0, cleanNumber(body?.addOnsAmount));
    const finalBalanceNote = getString(body?.finalBalanceNote);
    const shouldSendEmail = body?.sendEmail !== false;

    if (!requestId) return NextResponse.json({ ok: false, error: "Missing request ID." }, { status: 400 });
    if (dryWeightLbs <= 0) return NextResponse.json({ ok: false, error: "Enter the dry weight before creating a final balance invoice." }, { status: 400 });
    if (ratePerLb <= 0) return NextResponse.json({ ok: false, error: "Enter a valid per-pound rate." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });

    const data = requestSnap.data() || {};
    const serviceId = getString(data.service);

    if (serviceId !== "laundry-rescue") {
      return NextResponse.json({ ok: false, error: "Final balance invoice is only for Laundry Rescue requests." }, { status: 400 });
    }

    const email = getString(data.email);
    if (!email) return NextResponse.json({ ok: false, error: "Customer email is missing." }, { status: 400 });

    const fullName = getString(data.fullName) || "NestHelper customer";
    const city = getString(data.city);
    const preferredDate = getString(data.preferredDate);
    const preferredWindow = getString(data.preferredWindow);
    const depositCredit = getDepositCreditFromRecord(data, cleanNumber(body?.depositCredit));
    const laundryBaseAmount = dryWeightLbs * ratePerLb;
    const laundrySubtotal = laundryBaseAmount + addOnsAmount;
    const balanceDue = Math.max(0, laundrySubtotal - depositCredit);
    const balanceDueCents = moneyToCents(balanceDue);

    const updateBase = {
      laundryDryWeightLbs: Number(dryWeightLbs.toFixed(2)),
      laundryRatePerLb: Number(ratePerLb.toFixed(2)),
      laundryBaseAmount: Number(laundryBaseAmount.toFixed(2)),
      laundryBaseAmountCents: moneyToCents(laundryBaseAmount),
      laundryAddOnsAmount: Number(addOnsAmount.toFixed(2)),
      laundryDepositCredit: Number(depositCredit.toFixed(2)),
      laundryDepositCreditCents: moneyToCents(depositCredit),
      laundrySubtotal: Number(laundrySubtotal.toFixed(2)),
      laundrySubtotalCents: moneyToCents(laundrySubtotal),
      laundryBalanceDue: Number(balanceDue.toFixed(2)),
      laundryBalanceDueCents: balanceDueCents,
      laundryFinalBalanceNote: finalBalanceNote,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    };

    if (balanceDueCents <= 0) {
      await requestRef.update({
        ...updateBase,
        status: "Fully Paid",
        paymentStatus: "Fully Paid",
        laundryPaymentStatus: "Fully Paid",
        laundryFinalBalanceCreatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ ok: true, noBalanceDue: true, message: "No final balance is due. Request marked Fully Paid." });
    }

    const customer = await stripe.customers.create({
      email,
      name: fullName,
      phone: getString(data.phone) || undefined,
      address: getAddress(data),
      metadata: { requestId, serviceId: "laundry-rescue" },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 7,
      automatic_tax: { enabled: enableAutomaticTax },
      auto_advance: false,
      description: "Laundry Rescue final balance",
      footer:
        "This invoice reflects the final Laundry Rescue balance after dry weight, selected add-ons or bulky items, and the deposit/minimum credit already paid.",
      metadata: {
        requestId,
        serviceId: "laundry-rescue",
        serviceTitle: "Laundry Rescue final balance",
        paymentType: "laundry_final_balance",
        dryWeightLbs: String(Number(dryWeightLbs.toFixed(2))),
        ratePerLb: String(Number(ratePerLb.toFixed(2))),
        addOnsAmount: String(Number(addOnsAmount.toFixed(2))),
        depositCredit: String(Number(depositCredit.toFixed(2))),
        balanceDue: String(Number(balanceDue.toFixed(2))),
        siteUrl,
      },
    });

    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      currency: "usd",
      amount: moneyToCents(laundryBaseAmount),
      description: [
        "Laundry Rescue wash, dry, and fold — dry weight",
        `Calculation: ${formatNumber(dryWeightLbs)} lb × ${formatMoney(ratePerLb)} per lb`,
        `Dry weight total: ${formatMoney(laundryBaseAmount)}`,
      ].join("\n"),
      metadata: { requestId, serviceId: "laundry-rescue", lineType: "dry_weight" },
    });

    if (addOnsAmount > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        currency: "usd",
        amount: moneyToCents(addOnsAmount),
        description: [
          "Laundry add-ons / bulky items / approved extra work",
          "Includes approved items such as bulky pieces, rush changes, special handling, extra sorting, stain attention, or other reviewed laundry extras.",
          finalBalanceNote ? `Admin note: ${finalBalanceNote}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        metadata: { requestId, serviceId: "laundry-rescue", lineType: "add_ons" },
      });
    }

    if (depositCredit > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        currency: "usd",
        amount: -moneyToCents(depositCredit),
        description: [
          "Deposit/minimum credit already paid",
          `Credit applied to this final balance: -${formatMoney(depositCredit)}`,
        ].join("\n"),
        metadata: { requestId, serviceId: "laundry-rescue", lineType: "deposit_credit" },
      });
    }

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
    const hostedInvoiceUrl = finalized.hosted_invoice_url || "";
    const invoicePdf = finalized.invoice_pdf || "";

    if ((finalized.amount_due ?? 0) <= 0) {
      await requestRef.update({
        ...updateBase,
        laundryFinalInvoiceId: finalized.id,
        laundryFinalInvoiceNumber: finalized.number || "",
        laundryFinalInvoiceUrl: hostedInvoiceUrl,
        laundryFinalInvoicePdf: invoicePdf,
        laundryFinalInvoiceAmountDue: finalized.amount_due ?? null,
        laundryFinalInvoiceEmailWarning:
          "Stripe finalized this laundry final balance invoice at $0.00, so NestHelper did not email it. Review the weight, add-ons, and deposit credit before trying again.",
        laundryFinalBalanceCreatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Stripe finalized the laundry final balance invoice at $0.00. The invoice was not emailed. Review the dry weight, add-ons, and deposit credit and try again.",
        },
        { status: 500 }
      );
    }

    if (!hostedInvoiceUrl) {
      return NextResponse.json(
        { ok: false, error: "Stripe created the laundry final balance invoice, but no hosted invoice link was returned." },
        { status: 500 }
      );
    }

    let emailSent = false;
    let emailError = "";

    if (shouldSendEmail && email && hostedInvoiceUrl) {
      try {
        const result = (await sendLaundryFinalBalanceEmail({
          to: email,
          customerName: fullName,
          requestId,
          invoiceUrl: hostedInvoiceUrl,
          invoicePdf,
          invoiceNumber: finalized.number || undefined,
          dryWeightLbs,
          ratePerLb,
          addOnsAmount,
          depositCredit,
          balanceDue: (finalized.amount_due ?? balanceDueCents) / 100,
          note: finalBalanceNote,
          preferredDate,
          preferredWindow,
          city,
        })) as any;

        if (result?.skipped) {
          emailError = "Final balance invoice was created, but the NestHelper email was skipped. Copy and send the invoice link manually.";
        } else if (result?.error) {
          emailError = result.error?.message || "Final balance invoice was created, but the NestHelper email failed. Copy and send the invoice link manually.";
        } else {
          emailSent = true;
        }
      } catch (error) {
        console.error("Laundry final balance invoice email failed", error);
        emailError = "Final balance invoice was created, but the email failed. Copy and send the invoice link manually.";
      }
    }

    const nextStatus = shouldSendEmail && emailSent ? "Final Invoice Sent" : "Final Invoice Created";

    await requestRef.update({
      ...updateBase,
      status: nextStatus,
      paymentStatus: nextStatus,
      laundryPaymentStatus: nextStatus,
      laundryFinalInvoiceId: finalized.id,
      laundryFinalInvoiceNumber: finalized.number || "",
      laundryFinalInvoiceUrl: hostedInvoiceUrl,
      laundryFinalInvoicePdf: invoicePdf,
      laundryFinalInvoiceAmountDue: finalized.amount_due ?? null,
      laundryFinalInvoiceCustomerId: customer.id,
      laundryFinalInvoiceEmailSent: emailSent,
      laundryFinalInvoiceEmailError: emailError,
      laundryFinalInvoiceCreatedAt: FieldValue.serverTimestamp(),
      laundryFinalInvoiceSentAt: shouldSendEmail && emailSent ? FieldValue.serverTimestamp() : null,
      laundryFinalBalanceCreatedAt: FieldValue.serverTimestamp(),
      laundryFinalBalanceCreatedBy: decoded.email || "admin",
      // Keep older dashboard fields populated so existing buttons and filters do not break.
      laundryFinalCheckoutUrl: hostedInvoiceUrl,
      laundryFinalCheckoutSessionId: "",
    });

    return NextResponse.json({
      ok: true,
      invoiceId: finalized.id,
      invoiceNumber: finalized.number,
      invoiceUrl: hostedInvoiceUrl,
      invoicePdf,
      url: hostedInvoiceUrl,
      emailSent,
      emailError,
      balanceDue: (finalized.amount_due ?? balanceDueCents) / 100,
      status: nextStatus,
      paymentStatus: nextStatus,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error?.message || "Unable to create laundry final balance invoice." }, { status: 500 });
  }
}
