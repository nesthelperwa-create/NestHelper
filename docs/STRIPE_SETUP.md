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
2. NestHelper approves pickup and sends a non-refundable taxable deposit link.
3. Stripe checkout asks the customer to choose auto-charge for the final balance or invoice-before-delivery.
4. Laundry is dry-weighed at pickup.
5. Add-ons are confirmed.
6. Final balance is created as a Stripe Invoice with line-item breakdown.
7. If auto-charge was authorized and a saved payment method is available, the invoice is charged automatically. Otherwise, the final invoice is emailed before delivery and laundry is held until paid.

## What the code now supports

The site includes an admin-only payment flow:

- `/api/admin/create-payment-link` creates a Stripe Checkout Session for a reviewed request.
- The admin dashboard shows payment actions on `/admin/requests`.
- Admin can choose Standard price or Founding/Beta price.
- Admin can create and email the checkout link, or create the link only and copy it manually.
- The request status changes to `Checkout Sent`, or `Deposit Checkout Sent` for Laundry Rescue.
- `/api/stripe/webhook` can mark the request `Paid` after successful checkout when the Stripe webhook is configured.
- Laundry deposit checkout marks the request `Deposit Paid - Final Pending`, not fully paid.

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

Laundry Rescue deposit/minimum now uses dynamic Stripe `price_data` so it can stay tax-exclusive and support custom deposit amounts. You no longer need separate Laundry Rescue Deposit price IDs unless you want to keep them for your own Stripe reporting.

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
ENABLE_PUBLIC_CHECKOUT=false
ENABLE_STRIPE_AUTOMATIC_TAX=true
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

Recommended events at launch:

```text
checkout.session.completed
invoice.paid
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
- For Laundry Rescue, the first checkout should be a non-refundable deposit/minimum. The final balance should be a Stripe Invoice after dry weigh-in and add-ons.
- For live tax, complete Stripe Tax setup and set `ENABLE_STRIPE_AUTOMATIC_TAX=true`; otherwise tax will not be added in checkout/invoices.


## Sandbox tax note

For sandbox testing, `ENABLE_STRIPE_AUTOMATIC_TAX=false` lets checkout links work before the Stripe head office/tax profile is fully completed. Before real customer payments, complete Stripe business/tax setup and set `ENABLE_STRIPE_AUTOMATIC_TAX=true` if you want Stripe Checkout to calculate tax automatically.


## Laundry Rescue tax and final-balance choice note

Laundry Rescue deposits created from either Quick Checkout or the saved Family Payment Breakdown are Checkout Sessions, not normal Stripe invoices, so Stripe can collect the customer’s required final-balance choice: auto-charge saved card after weigh-in, or email final invoice before delivery. The final balance after dry weight remains a Stripe invoice with line-item details.

Laundry Rescue tax is forced on in code for deposit Checkout and final balance invoices with Stripe automatic tax enabled. The default Laundry Rescue product tax code is `txcd_20090012` (Linen Services - Laundry only) unless `STRIPE_LAUNDRY_TAX_CODE`, `STRIPE_PRODUCT_TAX_CODE`, or `STRIPE_TAX_CODE` is set in Vercel. Stripe Tax must be active in the Stripe account and the customer location must be collected/valid for tax to appear.


## NestHelper tax handling by service

The site now uses Stripe Tax selectively instead of taxing every package.

Required Vercel setting:

```text
ENABLE_STRIPE_AUTOMATIC_TAX=true
```

Recommended optional tax-code settings:

```text
STRIPE_LAUNDRY_TAX_CODE=txcd_20090012
STRIPE_COMMERCIAL_CLEANING_TAX_CODE=txcd_20010004
STRIPE_NONTAXABLE_TAX_CODE=txcd_00000000
```

Current behavior:

- Laundry Rescue deposit and final balance: taxable through Stripe Tax.
- Parent Reset, Family Reset, Helper Block, Errand Helper, and family-service invoices: not taxed by default.
- Commercial Reset routine/recurring janitorial-style lines: not taxed by default.
- Commercial Reset specialty/non-repetitive cleaning-style lines such as first-time reset, carpet deep cleaning, spot treatment, floor scrub, buff/shine, wax/finish, strip & wax, turnover, and linen/restock are treated as taxable commercial cleaning lines.
- If a commercial invoice mixes taxable and nontaxable lines, Stripe Tax is enabled for the invoice and each line is assigned either the commercial cleaning tax code or the nontaxable tax code.

Keep the Stripe Dashboard preset product category as a safe default, but the code now explicitly sets tax codes on the lines it creates so Laundry Rescue and Commercial Reset behave more predictably.

## Commercial Reset tax handling

Commercial Reset invoices are now selective by line item. The quote builder saves each commercial line with `taxMode: auto` by default. Routine/recurring janitorial-style lines are sent to Stripe with the nontaxable tax code, while specialty/deep/floor/carpet/turnover/linen/restock lines are sent as taxable commercial cleaning lines.

Admin can override a commercial line in the quote builder with **Tax mode**:
- **Auto**: NestHelper decides by preset/keywords.
- **Force taxable**: Stripe automatic tax applies to that line.
- **Force no tax**: Uses the nontaxable tax code for that line.

Recommended environment variables:

```text
ENABLE_STRIPE_AUTOMATIC_TAX=true
STRIPE_COMMERCIAL_CLEANING_TAX_CODE=txcd_20010004
STRIPE_NONTAXABLE_TAX_CODE=txcd_00000000
```

Keep your Stripe Dashboard preset product category set to **Nontaxable**. The code overrides taxable Laundry Rescue and taxable Commercial Reset lines where needed.
