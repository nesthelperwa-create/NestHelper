# Stripe Setup for NestHelper

## Recommended launch flow

NestHelper should stay request-first during beta:

1. Customer submits a request.
2. NestHelper reviews service area, availability, safety, scope, pets, access, promo code, and price.
3. Admin opens `/admin/requests`, clicks the request, and creates a Stripe checkout link.
4. Customer pays through the secure Stripe checkout link.
5. NestHelper confirms scheduling after payment.

Laundry:

1. Customer submits Laundry Rescue request.
2. NestHelper approves pickup and sends a deposit link.
3. Laundry is dry-weighed at pickup.
4. Add-ons are confirmed.
5. Final balance is sent by Stripe Invoice or another approved Stripe payment link.

## What the code now supports

The site includes an admin-only payment flow:

- `/api/admin/create-payment-link` creates a Stripe Checkout Session for a reviewed request.
- The admin dashboard shows payment actions on `/admin/requests`.
- Admin can choose Standard price or Founding/Beta price.
- Admin can create and email the checkout link, or create the link only and copy it manually.
- The request status changes to `Checkout Sent`.
- `/api/stripe/webhook` can mark the request `Paid` after successful checkout when the Stripe webhook is configured.

Public checkout remains disabled unless `ENABLE_PUBLIC_CHECKOUT=true`. Keep it disabled for the concierge beta.

## Stripe Tax

Turn on Stripe Tax and make prices tax-exclusive so WA tax is added on top of the service price.

Use this display language:

> Prices shown before applicable taxes and fees. Final checkout total is calculated securely through Stripe.

## Products/prices to create

Create standard and Founding Family/Beta prices for:

- 2-Hour Parent Reset
- 3-Hour Family Reset
- 4-Hour Helper Block
- Errand Helper
- Laundry Rescue Deposit

Recommended env vars:

```env
STRIPE_SECRET_KEY=sk_test_or_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_webhook_here
STRIPE_PRICE_PARENT_RESET_STANDARD=price_...
STRIPE_PRICE_PARENT_RESET_FOUNDING=price_...
STRIPE_PRICE_FAMILY_RESET_STANDARD=price_...
STRIPE_PRICE_FAMILY_RESET_FOUNDING=price_...
STRIPE_PRICE_HELPER_BLOCK_STANDARD=price_...
STRIPE_PRICE_HELPER_BLOCK_FOUNDING=price_...
STRIPE_PRICE_ERRAND_STANDARD=price_...
STRIPE_PRICE_ERRAND_FOUNDING=price_...
STRIPE_PRICE_LAUNDRY_DEPOSIT_STANDARD=price_...
STRIPE_PRICE_LAUNDRY_DEPOSIT_FOUNDING=price_...
ENABLE_PUBLIC_CHECKOUT=false
```

## Vercel env vars

Add the Stripe env vars in:

Vercel → NestHelper project → Settings → Environment Variables

Use Production, Preview, and Development unless you have a reason to split them.

After changing env vars, redeploy the site.

## Stripe webhook

Add a Stripe webhook endpoint:

```text
https://www.nesthelperwa.com/api/stripe/webhook
```

Recommended event at launch:

```text
checkout.session.completed
```

Copy the webhook signing secret from Stripe and save it in Vercel as:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

After the webhook is connected, successful Stripe checkout should update the matching Firestore `serviceRequests` document to `Paid`.

## Promo code

Use `FOUNDINGFAMILY` or a similar code during beta. Because discounts differ by service, the cleanest setup is separate Founding/Beta prices instead of one universal coupon.

## Important notes

- Do not turn on public checkout yet.
- Do not send a payment link until you approve service area, scope, safety, pets/access, and availability.
- For Laundry Rescue, the first checkout should usually be a deposit or minimum. Send the final balance later after dry weigh-in and add-ons.
