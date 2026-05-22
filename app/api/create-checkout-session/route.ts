import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripePriceId, normalizeStripePriceMode } from "@/lib/stripePriceMap";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const enableAutomaticTax = process.env.ENABLE_STRIPE_AUTOMATIC_TAX === "true";

export async function POST(req: Request) {
  if (process.env.ENABLE_PUBLIC_CHECKOUT !== "true") {
    return NextResponse.json({ error: "Checkout is disabled for request-first launch. Send Stripe links after approval." }, { status: 403 });
  }
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });

  const body = await req.json().catch(() => null) as { serviceId?: string; mode?: "standard" | "founding"; requestId?: string } | null;
  const serviceId = body?.serviceId;
  const mode = normalizeStripePriceMode(body?.mode);
  const priceId = getStripePriceId(serviceId, mode);
  if (!serviceId || !priceId) return NextResponse.json({ error: "Missing service or Stripe price ID." }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const requestId = body?.requestId || "manual-approved-request";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    automatic_tax: { enabled: enableAutomaticTax },
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    allow_promotion_codes: true,
    client_reference_id: requestId,
    success_url: `${baseUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout?cancelled=true`,
    metadata: { serviceId, requestId, paymentMode: mode }
  });

  return NextResponse.json({ url: session.url });
}
