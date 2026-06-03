# NestHelper referral payment credit update

This update is admin-only and does not touch Commercial Reset.

Changed files:
- `components/admin/FamilyPaymentBreakdownBuilder.tsx`
- `app/api/admin/create-family-invoice/route.ts`
- `app/api/admin/create-payment-link/route.ts`

What it does:
- Detects an incoming family referral on a request.
- Automatically defaults the Family Payment Breakdown discount/credit to the referral amount ($25 by default, $15 for Laundry Rescue fallback).
- Shows a clear referral-credit callout in the family payment builder.
- Adds an Apply referral credit button.
- Changes the checkout-fill button text to make it clear it uses the referral price.
- Blocks accidental full-price invoice/quick checkout if a referred request has not saved the expected referral credit.

Recommended admin flow for referred family requests:
1. Open request details.
2. Open Family Payment Breakdown.
3. Confirm/apply referral credit.
4. Save family breakdown.
5. Create the family invoice or click Fill checkout with referral price, then send checkout.

No Firebase rules deploy is required for this update.
