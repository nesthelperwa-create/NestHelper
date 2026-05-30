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
const enableAutomaticTax = process.env.ENABLE_STRIPE_AUTOMATIC_TAX === "true";

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getServicePriceLabel(serviceId: string, mode: "standard" | "founding") {
  const service = services.find((item) => item.id === serviceId);
  if (!service) return "";
  return mode === "founding" ? service.foundingPrice || service.standardPrice : service.standardPrice;
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

    const body = (await request.json().catch(() => null)) as { requestId?: string; mode?: "standard" | "founding"; sendEmail?: boolean } | null;
    const requestId = getString(body?.requestId);
    const mode = normalizeStripePriceMode(body?.mode);
    const shouldSendEmail = body?.sendEmail !== false;

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
    const priceId = getStripePriceId(serviceId, mode);

    if (!serviceId || !priceId) {
      return NextResponse.json(
        { ok: false, error: `Missing Stripe ${mode} price ID for this service. Check the service selection and Vercel Stripe price env vars.` },
        { status: 400 }
      );
    }

    const email = getString(data.email);
    const fullName = getString(data.fullName);
    const phone = getString(data.phone);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: { enabled: enableAutomaticTax },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      customer_email: email || undefined,
      client_reference_id: requestId,
      success_url: `${siteUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=true&request_id=${requestId}`,
      metadata: {
        requestId,
        serviceId,
        serviceTitle,
        paymentMode: mode,
        paymentType: serviceId === "laundry-rescue" ? "laundry_deposit" : "service_payment",
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
      },
    });

    const checkoutUrl = session.url || "";
    const isLaundryRescue = serviceId === "laundry-rescue";
    const replyToEmail = isLaundryRescue ? emailAliases.laundry : emailAliases.billing;
    let emailSent = false;
    let emailError = "";

    if (shouldSendEmail && email && checkoutUrl) {
      try {
        await sendPaymentLinkEmail({
          to: email,
          customerName: fullName,
          requestId,
          serviceTitle,
          servicePrice: getServicePriceLabel(serviceId, mode),
          paymentUrl: checkoutUrl,
          preferredDate: getString(data.preferredDate),
          preferredWindow: getString(data.preferredWindow),
          city: getString(data.city),
          replyToEmail,
        });
        emailSent = true;
      } catch (error) {
        console.error("Payment link email failed", error);
        emailError = "Checkout link was created, but the email failed. Copy and send the link manually.";
      }
    }


    await requestRef.update({
      status: "Checkout Sent",
      paymentStatus: isLaundryRescue ? "Deposit Checkout Sent" : "Checkout Sent",
      laundryPaymentStatus: isLaundryRescue ? "Deposit Checkout Sent" : data.laundryPaymentStatus || null,
      paymentMode: mode,
      checkoutUrl,
      checkoutSessionId: session.id,
      stripePriceId: priceId,
      checkoutCreatedAt: FieldValue.serverTimestamp(),
      checkoutSentAt: emailSent ? FieldValue.serverTimestamp() : null,
      checkoutEmailSent: emailSent,
      checkoutEmailError: emailError,
      checkoutCreatedBy: decoded.email || "admin",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decoded.email || "admin",
    });

    return NextResponse.json({ ok: true, url: checkoutUrl, sessionId: session.id, emailSent, emailError });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to create payment link." }, { status: 500 });
  }
}
