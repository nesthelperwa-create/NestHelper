# Laundry intro pricing update

## What changed

- Updated Laundry Rescue public wording to: `Laundry Rescue intro launch pricing: $59 minimum + $2.25/lb.`
- Kept the $59 minimum/deposit.
- Changed the default final-balance per-pound rate from `2.99` to `2.25` in the admin laundry final balance tools and backend fallback.
- Added simple customer-facing wording that Laundry Rescue includes wash, dry, fold, and return, with eco-friendly detergent available.
- Updated FAQ, request form copy, service data, service card display, confirmation email next-step wording, admin quote-prompt guidance, family payment builder preset, and payment documentation.

## Where the old $2.99/lb appeared

- `components/ServiceCard.tsx` — public Laundry Rescue card display.
- `lib/services.ts` — service details, standard price, and note.
- `components/forms/RequestForm.tsx` — Laundry Rescue request form wording.
- `app/faq/page.tsx` — laundry pricing FAQ.
- `lib/sendCustomerConfirmationEmail.ts` — service request confirmation next-step wording.
- `components/admin/AdminTable.tsx` — quote prompt guidance and default admin final-balance rate.
- `components/admin/FamilyPaymentBreakdownBuilder.tsx` — saved family payment breakdown preset for laundry dry weight.
- `app/api/admin/create-laundry-final-balance/route.ts` — backend default fallback per-pound rate for final balance invoices.
- `docs/STRIPE_SETUP.md` and `docs/PAYMENT_APPROVAL_FLOW.md` — internal payment documentation.

## Stripe check

No hard-coded Stripe `price_...` or `prod_...` IDs tied to `$2.99/lb` were found.

Current code behavior:

- Laundry Rescue deposit/minimum checkout is created with dynamic Stripe `price_data` in `app/api/admin/create-payment-link/route.ts` and `app/api/admin/create-family-invoice/route.ts`.
- Laundry final balance uses custom Stripe invoice items in `app/api/admin/create-laundry-final-balance/route.ts` based on the admin-entered dry weight and rate.
- Public checkout blocks `laundry-rescue`, so the public Stripe price map is not used for Laundry Rescue public checkout.

Because of that, Stripe should not need a new saved product/price for this update unless you intentionally created or still use a Stripe Dashboard product/price for separate reporting outside this code flow. Do not edit old Stripe prices; if you later decide to use a saved Stripe price for laundry reporting, create a new `$2.25/lb` price and stop using/archive the old `$2.99/lb` price.
