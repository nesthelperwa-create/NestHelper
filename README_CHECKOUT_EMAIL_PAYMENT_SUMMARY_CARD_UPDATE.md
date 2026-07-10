# Checkout Email Payment Summary Card Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx
- app/api/admin/create-payment-link/route.ts
- lib/sendPaymentLinkEmail.ts
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts
- lib/campaignAttribution.ts

What changed:
- Fixes the actual customer quick-checkout email layout.
- The saved payment summary now renders as a clean HTML card instead of one crowded plain-text block.
- Adds spacing and clear sections:
  - Service Details
  - Items Included
  - Amount Summary
  - Customer Note
  - Please Note
- Changes customer-facing email wording from breakdown/quote/draft language to “payment summary.”
- Sanitizes older saved summaries so customer emails do not say “draft estimate.”
- Keeps admin-only wording such as Draft Estimate Builder inside admin only.

What did NOT change:
- No Stripe checkout/session logic.
- No pricing math.
- No tax math.
- No referral amounts.
- No payment/email sending trigger behavior.
- No request creation logic.
- No status update logic.
