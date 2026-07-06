# Laundry included-weight pricing update

## Summary

This update changes Laundry Rescue wording so it no longer reads like customers pay a minimum plus weight from the first pound.

New public wording direction:

`Laundry Rescue intro launch pricing: $59 minimum includes pickup, wash, dry, fold, return, and up to about 26.2 lbs of laundry. Additional laundry is $2.25/lb.`

Short card wording:

- `$59 minimum`
- `Includes up to 26.2 lbs`
- `Additional laundry is $2.25/lb`
- `Pickup, wash, dry, fold, and return included`

## Where old pricing/wording appeared

The old plus-sign wording and older per-pound references were reviewed across active site, admin, API, email, and docs files.

Updated areas include:

- public service cards and service detail copy
- request form helper text
- FAQ laundry pricing answer
- customer confirmation and payment emails
- admin quote prompt guidance
- admin laundry final-balance labels/calculation
- backend final-balance invoice creation
- Stripe setup/payment flow docs

## Stripe / payment logic check

No saved Stripe `price_...` or `prod_...` IDs tied to the laundry per-pound rate were found in the active code.

The Laundry Rescue intro minimum uses dynamic Stripe `price_data` in:

- `app/api/admin/create-payment-link/route.ts`
- `app/api/admin/create-family-invoice/route.ts`

The admin final-balance invoice logic is in:

- `app/api/admin/create-laundry-final-balance/route.ts`

Because the new customer-facing price means the $59 minimum includes up to about 26.2 lbs, the final-balance logic was also adjusted so the final invoice charges only:

- additional laundry above the included minimum weight,
- approved add-ons,
- bulky items, or
- approved changes.

No Stripe Dashboard product/price needs to be edited for this website flow. If there is an old manual Stripe Dashboard product outside the website, do not edit the old price; create/use a new reference only if needed for separate manual reporting.

## Files changed

- `lib/services.ts`
- `components/ServiceCard.tsx`
- `components/forms/RequestForm.tsx`
- `app/faq/page.tsx`
- `app/services/page.tsx`
- `app/page.tsx`
- `app/checkout/page.tsx`
- `lib/sendCustomerConfirmationEmail.ts`
- `lib/sendPaymentReceivedEmail.ts`
- `lib/sendLaundryFinalBalanceEmail.ts`
- `components/admin/AdminTable.tsx`
- `components/admin/FamilyPaymentBreakdownBuilder.tsx`
- `app/api/admin/create-laundry-final-balance/route.ts`
- `app/api/admin/create-payment-link/route.ts`
- `app/api/admin/create-family-invoice/route.ts`
- `app/api/stripe/webhook/route.ts`
- `docs/STRIPE_SETUP.md`
- `docs/PAYMENT_APPROVAL_FLOW.md`
- `docs/LAUNDRY_FINAL_BALANCE.md`

No dependencies changed.
