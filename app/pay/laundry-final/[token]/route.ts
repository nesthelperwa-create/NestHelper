import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import {
  createLaundryFinalCheckoutSession,
  getLaundryFinalStableUrl,
  isLaundryFinalCheckoutSessionPaid,
  isLaundryFinalCheckoutSessionUsable,
} from "@/lib/laundryFinalCheckout";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

type RouteContext = { params: Promise<{ token: string }> | { token: string } };

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function statusLooksPaid(value: unknown) {
  const status = getString(value).toLowerCase();
  return status.includes("fully paid") || status.includes("final balance paid") || status === "paid";
}

function isAlreadyPaid(data: Record<string, unknown>) {
  return (
    statusLooksPaid(data.status) ||
    statusLooksPaid(data.paymentStatus) ||
    statusLooksPaid(data.laundryPaymentStatus) ||
    statusLooksPaid(data.laundryFinalInvoiceStatus) ||
    Boolean(data.laundryFinalBalancePaidAt || data.laundryFinalInvoicePaidAt)
  );
}

function isClosed(data: Record<string, unknown>) {
  const status = [data.status, data.paymentStatus]
    .map((value) => getString(value).toLowerCase())
    .join(" ");
  return ["cancel", "closed", "archiv", "void", "deleted"].some((word) => status.includes(word));
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
  const accent = tone === "success" ? "#075c58" : tone === "error" ? "#9b2c2c" : "#075c58";
  const bg = tone === "error" ? "#fff5f5" : "#faf7ef";
  const body = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:${bg};font-family:Arial,sans-serif;color:#24333a"><main style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box"><section style="width:100%;max-width:560px;background:#fff;border:1px solid #eadfc8;border-radius:24px;padding:30px;box-sizing:border-box;box-shadow:0 16px 45px rgba(7,92,88,.12)"><div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:#b98a2f">NestHelper Laundry Rescue</div><h1 style="margin:10px 0 12px;font-size:28px;line-height:1.2;color:${accent}">${title}</h1><p style="margin:0;font-size:16px;line-height:1.65">${text}</p><p style="margin:24px 0 0;font-size:13px;color:#667">Questions? Contact NestHelper at 425-790-1330 or hello@nesthelperwa.com.</p></section></main></body></html>`;
  return new NextResponse(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function GET(_request: Request, context: RouteContext) {
  const resolvedParams = await Promise.resolve(context.params);
  const token = getString(resolvedParams.token);

  if (!token || token.length < 32) {
    return htmlPage({
      tone: "error",
      status: 404,
      title: "This final balance link is not valid.",
      text: "Please use the most recent NestHelper message or contact us and we can resend the link.",
    });
  }

  if (!stripe) {
    return htmlPage({
      tone: "error",
      status: 503,
      title: "Payment is temporarily unavailable.",
      text: "Stripe is not configured for this payment. Please contact NestHelper and we will help.",
    });
  }

  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db.collection("serviceRequests").where("laundryFinalAccessToken", "==", token).limit(1).get();

    if (snapshot.empty) {
      return htmlPage({
        tone: "error",
        status: 404,
        title: "This final balance link was not found.",
        text: "Please use the most recent NestHelper message or contact us and we can resend the link.",
      });
    }

    const requestDoc = snapshot.docs[0];
    const requestId = requestDoc.id;
    const requestRef = requestDoc.ref;
    const data = requestDoc.data() || {};

    if (isAlreadyPaid(data)) {
      return htmlPage({
        tone: "success",
        title: "This final balance is already paid.",
        text: "Thank you. NestHelper has recorded the Laundry Rescue final balance as paid.",
      });
    }

    if (isClosed(data)) {
      return htmlPage({
        tone: "error",
        status: 410,
        title: "This final balance link is no longer active.",
        text: "The related Laundry Rescue request was closed or canceled. Please contact NestHelper if you still need help.",
      });
    }

    const existingSessionId = getString(data.laundryFinalCheckoutSessionId);
    if (existingSessionId) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(existingSessionId);

        if (isLaundryFinalCheckoutSessionPaid(existingSession)) {
          await requestRef.update({
            status: "Fully Paid",
            paymentStatus: "Final Balance Paid",
            laundryPaymentStatus: "Final Balance Paid",
            laundryFinalCheckoutStatus: "Paid",
            laundryFinalBalancePaidAt: FieldValue.serverTimestamp(),
            laundryFinalCheckoutLastUsedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: "laundry-final-smart-link",
          });

          return htmlPage({
            tone: "success",
            title: "This final balance is already paid.",
            text: "Thank you. NestHelper has recorded the Laundry Rescue final balance as paid.",
          });
        }

        if (isLaundryFinalCheckoutSessionUsable(existingSession) && existingSession.url) {
          await requestRef.update({ laundryFinalCheckoutLastUsedAt: FieldValue.serverTimestamp() });
          return NextResponse.redirect(existingSession.url, { status: 303 });
        }
      } catch {
        // Create a fresh Stripe Checkout session below.
      }
    }

    const { session, manualSalesTaxRateId, stableUrl } = await createLaundryFinalCheckoutSession({
      stripe,
      requestId,
      data,
      token,
    });

    await requestRef.update({
      laundryFinalAccessToken: token,
      laundryFinalCheckoutUrl: stableUrl || getLaundryFinalStableUrl(token),
      laundryFinalStripeCheckoutUrl: session.url || "",
      laundryFinalCheckoutSessionId: session.id,
      laundryFinalCheckoutStatus: "Open",
      laundryFinalCheckoutRefreshedAt: FieldValue.serverTimestamp(),
      laundryFinalCheckoutRefreshCount: FieldValue.increment(1),
      laundryFinalCheckoutLastUsedAt: FieldValue.serverTimestamp(),
      manualSalesTaxRateId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "laundry-final-smart-link",
    });

    if (session.url) return NextResponse.redirect(session.url, { status: 303 });

    return htmlPage({
      tone: "error",
      status: 502,
      title: "The final balance payment could not open.",
      text: "Stripe did not return a payment page. Please contact NestHelper and we can resend the link.",
    });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Please contact NestHelper and we can resend the link.";
    return htmlPage({ tone: "error", status: 500, title: "The final balance payment could not open.", text: message });
  }
}
