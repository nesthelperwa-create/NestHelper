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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
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
    if (dryWeightLbs <= 0) return NextResponse.json({ ok: false, error: "Enter the dry weight before creating a final balance." }, { status: 400 });
    if (ratePerLb <= 0) return NextResponse.json({ ok: false, error: "Enter a valid per-pound rate." }, { status: 400 });

    const db = getFirebaseAdminDb();
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) return NextResponse.json({ ok: false, error: "Service request not found." }, { status: 404 });

    const data = requestSnap.data() || {};
    const serviceId = getString(data.service);

    if (serviceId !== "laundry-rescue") {
      return NextResponse.json({ ok: false, error: "Final balance checkout is only for Laundry Rescue requests." }, { status: 400 });
    }

    const email = getString(data.email);
    const fullName = getString(data.fullName);
    const city = getString(data.city);
    const preferredDate = getString(data.preferredDate);
    const preferredWindow = getString(data.preferredWindow);
    const depositCredit = getDepositCreditFromRecord(data, cleanNumber(body?.depositCredit));
    const laundrySubtotal = dryWeightLbs * ratePerLb + addOnsAmount;
    const balanceDue = Math.max(0, laundrySubtotal - depositCredit);
    const balanceDueCents = moneyToCents(balanceDue);

    const updateBase = {
      laundryDryWeightLbs: Number(dryWeightLbs.toFixed(2)),
      laundryRatePerLb: Number(ratePerLb.toFixed(2)),
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: balanceDueCents,
            product_data: {
              name: "Laundry Rescue final balance",
              description: `${formatMoney(balanceDue)} remaining balance after dry weigh-in`,
            },
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: enableAutomaticTax },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      allow_promotion_codes: false,
      customer_email: email || undefined,
      client_reference_id: requestId,
      success_url: `${siteUrl}/checkout?success=true&payment_type=laundry_final_balance&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=true&payment_type=laundry_final_balance&request_id=${requestId}`,
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
        customerName: fullName,
        customerEmail: email,
      },
    });

    const checkoutUrl = session.url || "";
    let emailSent = false;
    let emailError = "";

    if (shouldSendEmail && email && checkoutUrl) {
      try {
        await sendLaundryFinalBalanceEmail({
          to: email,
          customerName: fullName,
          requestId,
          paymentUrl: checkoutUrl,
          dryWeightLbs,
          ratePerLb,
          addOnsAmount,
          depositCredit,
          balanceDue,
          note: finalBalanceNote,
          preferredDate,
          preferredWindow,
          city,
        });
        emailSent = true;
      } catch (error) {
        console.error("Laundry final balance email failed", error);
        emailError = "Final balance link was created, but the email failed. Copy and send the link manually.";
      }
    }

    await requestRef.update({
      ...updateBase,
      status: "Final Balance Sent",
      paymentStatus: "Final Balance Sent",
      laundryPaymentStatus: "Final Balance Sent",
      laundryFinalCheckoutUrl: checkoutUrl,
      laundryFinalCheckoutSessionId: session.id,
      laundryFinalBalanceSentAt: emailSent ? FieldValue.serverTimestamp() : null,
      laundryFinalBalanceEmailSent: emailSent,
      laundryFinalBalanceEmailError: emailError,
      laundryFinalBalanceCreatedAt: FieldValue.serverTimestamp(),
      laundryFinalBalanceCreatedBy: decoded.email || "admin",
    });

    return NextResponse.json({ ok: true, url: checkoutUrl, sessionId: session.id, emailSent, emailError, balanceDue });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to create laundry final balance link." }, { status: 500 });
  }
}
