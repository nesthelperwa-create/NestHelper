import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { services } from "@/lib/services";
import { sendPaymentReceivedEmail } from "@/lib/sendPaymentReceivedEmail";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getServiceTitle(data: Record<string, unknown>, fallback?: string) {
  const serviceId = getString(data.service);
  return getString(data.selectedServiceTitle) || fallback || services.find((item) => item.id === serviceId)?.title || serviceId || "NestHelper service";
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook secret is not configured." }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ ok: false, error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const requestId = session.metadata?.requestId || session.client_reference_id || "";

      if (requestId) {
        const db = getFirebaseAdminDb();
        const requestRef = db.collection("serviceRequests").doc(requestId);
        const requestSnap = await requestRef.get();
        const existingData = requestSnap.exists ? requestSnap.data() || {} : {};
        const serviceId = getString(session.metadata?.serviceId) || getString(existingData.service);
        const paymentType = getString(session.metadata?.paymentType);
        const isLaundryFinalBalance = paymentType === "laundry_final_balance";
        const isLaundryDeposit = serviceId === "laundry-rescue" && !isLaundryFinalBalance;
        const status = isLaundryFinalBalance ? "Fully Paid" : isLaundryDeposit ? "Deposit Paid" : "Paid";
        const paymentStatus = isLaundryFinalBalance ? "Final Balance Paid" : isLaundryDeposit ? "Deposit Paid" : "Paid";

        const updatePayload: Record<string, unknown> = {
          status,
          paymentStatus,
          checkoutSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : "",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : "",
          amountSubtotal: session.amount_subtotal ?? null,
          amountTotal: session.amount_total ?? null,
          currency: session.currency || "usd",
          paidAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "stripe-webhook",
        };

        if (isLaundryDeposit) {
          updatePayload.laundryPaymentStatus = "Deposit Paid";
          updatePayload.depositPaidAmountTotal = session.amount_total ?? null;
          updatePayload.depositPaidAt = FieldValue.serverTimestamp();
          updatePayload.laundryDepositAmountTotal = session.amount_total ?? null;
          updatePayload.laundryDepositPaidAt = FieldValue.serverTimestamp();
        }

        if (isLaundryFinalBalance) {
          updatePayload.laundryPaymentStatus = "Final Balance Paid";
          updatePayload.laundryFinalBalancePaidAt = FieldValue.serverTimestamp();
          updatePayload.laundryFinalBalancePaidAmountTotal = session.amount_total ?? null;
          updatePayload.laundryFinalPaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
          updatePayload.laundryFinalCheckoutSessionId = session.id;
        }

        await requestRef.update(updatePayload);

        const email = getString(existingData.email) || getString(session.customer_details?.email) || getString(session.customer_email);
        const confirmationFlag = isLaundryFinalBalance
          ? "laundryFinalConfirmationEmailSent"
          : isLaundryDeposit
            ? "laundryDepositConfirmationEmailSent"
            : "paymentConfirmationEmailSent";
        const confirmationAt = isLaundryFinalBalance
          ? "laundryFinalConfirmationEmailSentAt"
          : isLaundryDeposit
            ? "laundryDepositConfirmationEmailSentAt"
            : "paymentConfirmationEmailSentAt";
        const confirmationError = isLaundryFinalBalance
          ? "laundryFinalConfirmationEmailError"
          : isLaundryDeposit
            ? "laundryDepositConfirmationEmailError"
            : "paymentConfirmationEmailError";
        const alreadySent = Boolean(existingData[confirmationFlag]);

        if (email && !alreadySent) {
          try {
            await sendPaymentReceivedEmail({
              to: email,
              customerName: getString(existingData.fullName) || getString(session.customer_details?.name),
              requestId,
              serviceTitle: isLaundryFinalBalance ? "Laundry Rescue final balance" : isLaundryDeposit ? "Laundry Rescue deposit/minimum" : getServiceTitle(existingData, session.metadata?.serviceTitle),
              amountTotal: session.amount_total,
              currency: session.currency,
              paymentStatus,
            });

            await requestRef.update({
              [confirmationFlag]: true,
              [confirmationAt]: FieldValue.serverTimestamp(),
              [confirmationError]: "",
            });
          } catch (error) {
            console.error("Payment received email failed", error);
            await requestRef.update({
              [confirmationFlag]: false,
              [confirmationError]: "Payment was recorded, but the NestHelper payment confirmation email failed.",
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed", error);
    return NextResponse.json({ ok: false, error: "Webhook handling failed." }, { status: 500 });
  }
}
