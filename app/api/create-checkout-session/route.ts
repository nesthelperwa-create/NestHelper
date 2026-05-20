import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const priceMap: Record<string, { standard?: string; founding?: string }> = {
  "parent-reset-2hr": { standard: process.env.STRIPE_PRICE_PARENT_RESET_STANDARD, founding: process.env.STRIPE_PRICE_PARENT_RESET_FOUNDING },
  "family-reset-3hr": { standard: process.env.STRIPE_PRICE_FAMILY_RESET_STANDARD, founding: process.env.STRIPE_PRICE_FAMILY_RESET_FOUNDING },
  "helper-block-4hr": { standard: process.env.STRIPE_PRICE_HELPER_BLOCK_STANDARD, founding: process.env.STRIPE_PRICE_HELPER_BLOCK_FOUNDING },
  "errand-helper": { standard: process.env.STRIPE_PRICE_ERRAND_STANDARD, founding: process.env.STRIPE_PRICE_ERRAND_FOUNDING },
  "laundry-rescue": { standard: process.env.STRIPE_PRICE_LAUNDRY_DEPOSIT_STANDARD, founding: process.env.STRIPE_PRICE_LAUNDRY_DEPOSIT_FOUNDING }
};

export async function POST(req: Request) {
  if (process.env.ENABLE_PUBLIC_CHECKOUT !== "true") {
    return NextResponse.json({ error: "Checkout is disabled for request-first launch. Send Stripe links after approval." }, { status: 403 });
  }
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });

  const body = await req.json().catch(() => null) as { serviceId?: string; mode?: "standard" | "founding"; requestId?: string } | null;
  const serviceId = body?.serviceId;
  const mode = body?.mode || "standard";
  const priceId = serviceId ? priceMap[serviceId]?.[mode] : undefined;
  if (!serviceId || !priceId) return NextResponse.json({ error: "Missing service or Stripe price ID." }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    allow_promotion_codes: true,
    success_url: `${baseUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout?cancelled=true`,
    metadata: { serviceId, requestId: body?.requestId || "manual-approved-request" }
  });

  return NextResponse.json({ url: session.url });
}
