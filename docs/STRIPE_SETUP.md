# Stripe Setup for NestHelper

## Recommended launch flow

Regular services:

1. Customer submits request.
2. NestHelper reviews service area, availability, safety, scope, pets, access, promo code, and price.
3. NestHelper sends the correct Stripe Payment Link or Checkout Session link by text/email.
4. Customer pays.
5. Visit is confirmed.

Laundry:

1. Customer submits Laundry Rescue request.
2. NestHelper approves pickup and sends a deposit link.
3. Laundry is dry-weighed at pickup.
4. Add-ons are confirmed.
5. Final balance is sent by Stripe Invoice or Payment Link.

## Stripe Tax

Turn on Stripe Tax and make prices tax-exclusive so WA tax is added on top of the service price.

Use this display language:

> Prices shown before applicable taxes and fees. Final checkout total is calculated securely through Stripe.

## Products/prices to create

Create standard and Founding Family prices for:

- 2-Hour Parent Reset
- 3-Hour Family Reset
- 4-Hour Helper Block
- Errand Helper
- Laundry Rescue Deposit

Recommended price IDs go into `.env.local`.

## Promo code

Use `FOUNDINGFAMILY`. Because discounts differ by service, the cleanest setup is separate Founding Family prices/links rather than one universal coupon.

## API route

`app/api/create-checkout-session/route.ts` is included for later automation. It is disabled unless `ENABLE_PUBLIC_CHECKOUT=true`.

Keep request-first payments at launch to avoid charging for jobs you cannot staff.
