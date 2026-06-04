# NestHelper Customer Credit Ledger Update

This update turns referral rewards into saved customer credits instead of relying on the customer to reply to an email.

## What changed

- When a referred family completes an eligible family request, NestHelper creates a `customerCredits` record for the original referring customer's email.
- The referral reward email now tells the customer their credit is saved under the same email address.
- The admin dashboard watches available customer credits and shows a clear notice when a future family request uses the same customer email.
- The Family Payment Breakdown Builder auto-suggests the total credit to apply:
  - incoming referral discount for the new referred family, if present
  - saved referral credit for returning customers, if present
- Family checkout/invoice creation blocks sending full-price payment if a required referral/customer credit has not been applied and saved first.
- When a saved customer credit is used on a checkout or family invoice, the credit is reserved to prevent double use.
- Stripe webhooks mark reserved credits as Used after payment is completed.

## What was not changed

- Commercial Reset form, page, quote builder, invoice, and payment flow were not changed.
- The public site layout/styling was not redesigned.
- Referral credits are still admin-controlled credits, not cash payouts.

## Firestore rules

This update adds admin-only access for the `customerCredits` collection. Deploy Firestore rules after Vercel deploys.
