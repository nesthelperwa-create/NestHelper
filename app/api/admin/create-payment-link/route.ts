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

type CreatePaymentLinkBody = {
  requestId?: string;
  mode?: "standard" | "founding";
  sendEmail?: boolean;
  customInitial?: boolean;
  customAmount?: number | string;
  customTitle?: string;
  customNote?: string;
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

function getServicePriceLabel(serviceId: string, mode: "standard" | "founding") {
  const service = services.find((item) => item.id === serviceId);
  if (!service) return "";
  return mode === "founding" ? service.foundingPrice || service.standardPrice : service.standardPrice;
}

function getDefaultCustomTitle(serviceTitle: string, isLaundryRescue: boolean) {
  return isLaundryRescue ? "Laundry Rescue custom deposit" : `${serviceTitle} custom checkout`;
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

    if (!serviceId) {
      return NextResponse.json({ ok: false, error: "Missing service selection for this request." }, { status: 400 });
    }

    const customAmount = cleanNumber(body?.customAmount);
    const customAmountCents = moneyToCents(customAmount);
    const customTitle = getString(body?.customTitle) || getDefaultCustomTitle(serviceTitle, isLaundryRescue);
    const customNote = getString(body?.customNote);
    const priceId = useCustomInitial ? "" : getStripePriceId(serviceId, mode);

    if (useCustomInitial && customAmountCents <= 0) {
      return NextResponse.json({ ok: false, error: "Enter a custom initial amount greater than $0." }, { status: 400 });
    }

    if (!useCustomInitial && !priceId) {
      return NextResponse.json(
        { ok: false, error: `Missing Stripe ${mode} price ID for this service. Check the service selection and Vercel Stripe price env vars.` },
        { status: 400 }
      );
    }

    const email = getString(data.email);
    const fullName = getString(data.fullName);
    const phone = getString(data.phone);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = useCustomInitial
      ? [
          {
            price_data: {
              currency: "usd",
              unit_amount: customAmountCents,
              product_data: {
                name: customTitle,
                description: customNote || `${serviceTitle} — ${formatMoney(customAmount)}`,
              },
            },
            quantity: 1,
          },
        ]
      : [{ price: priceId, quantity: 1 }];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      automatic_tax: { enabled: enableAutomaticTax },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      allow_promotion_codes: !useCustomInitial,
      customer_email: email || undefined,
      client_reference_id: requestId,
      success_url: `${siteUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=true&request_id=${requestId}`,
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
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
      },
    });

    const checkoutUrl = session.url || "";
    const replyToEmail = isLaundryRescue ? emailAliases.laundry : emailAliases.billing;
    const servicePrice = useCustomInitial ? `${formatMoney(customAmount)} custom initial checkout` : getServicePriceLabel(serviceId, mode);
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
        });
        emailSent = true;
      } catch (error) {
        console.error("Payment link email failed", error);
        emailError = "Checkout link was created, but the email failed. Copy and send the link manually.";
      }
    }

    const updatePayload: Record<string, unknown> = {
      status: "Checkout Sent",
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

    return NextResponse.json({ ok: true, url: checkoutUrl, sessionId: session.id, emailSent, emailError, customInitial: useCustomInitial });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Unable to create payment link." }, { status: 500 });
  }
}
