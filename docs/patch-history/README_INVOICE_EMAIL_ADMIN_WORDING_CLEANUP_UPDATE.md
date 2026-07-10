# Invoice Email + Admin Wording + Patch History Cleanup

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx
- lib/sendFamilyInvoiceEmail.ts
- lib/sendCommercialInvoiceEmail.ts
- lib/sendPaymentLinkEmail.ts
- app/api/admin/create-payment-link/route.ts
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts
- lib/campaignAttribution.ts

What changed:
1. Formal invoice emails
- Family invoice emails now use the same cleaner payment-summary card layout as quick checkout emails.
- Commercial invoice emails now use the same cleaner payment-summary card layout as quick checkout emails.
- Customer-facing invoice email wording uses “payment summary” instead of draft/breakdown language.
- Older saved summary text is sanitized so customers do not see “draft estimate.”

2. Admin wording cleanup
- Cleans up remaining admin wording around Family Payment Breakdown / saved family draft estimate.
- Uses clearer wording:
  - Draft Estimate Builder
  - saved customer payment summary
  - saved commercial quote summary
- Updates service line item defaults so future customer-facing summaries say reviewed amount instead of draft estimate.

4. Patch history cleanup
- This patch places new notes under docs/patch-history.
- Run the cleanup command in the install instructions to move older root README_*.md and *_DIFF_PREVIEW.txt files into docs/patch-history.

What did NOT change:
- No Stripe checkout/session/invoice creation logic.
- No pricing math.
- No tax math.
- No referral amounts.
- No customer email sending trigger behavior.
- No request creation logic.
- No status update logic.
- No public form logic.
