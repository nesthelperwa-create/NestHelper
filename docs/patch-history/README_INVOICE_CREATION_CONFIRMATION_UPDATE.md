# Invoice Creation Confirmation Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx
- app/api/admin/create-payment-link/route.ts
- lib/sendPaymentLinkEmail.ts
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts
- lib/campaignAttribution.ts

What changed:
- Adds a browser confirmation popup before creating a formal Stripe invoice/PDF.
- Applies to:
  - Commercial invoice: Create + email invoice link
  - Commercial invoice: Create invoice only
  - Family invoice: Create + email family invoice
  - Family invoice: Create family invoice only
- The popup warns that Stripe invoices may cost more than a simple quick checkout link and asks admin to confirm.
- Laundry Rescue deposit checkout is not changed because that button is a deposit checkout flow, not the optional family invoice/PDF workflow.

What did NOT change:
- No Stripe invoice/session logic.
- No pricing math.
- No tax math.
- No referral amounts.
- No customer email layout or sending logic.
- No quick checkout behavior.
- No request creation or status logic.
