# Customer Payment Summary Spacing Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts
- lib/campaignAttribution.ts

What changed:
- Makes the customer-facing payment summary easier to read with clear sections:
  - Service Details
  - Items Included
  - Amount Summary
  - Customer Note
  - Please Note
- Adds blank lines between sections and line items.
- Changes the preview label from “Customer-facing draft estimate” to “Customer-facing payment summary.”
- Changes copied/downloaded customer text to use “payment summary” wording instead of draft/breakdown wording.
- Slightly increases preview text size and line spacing in admin.

What did NOT change:
- No pricing math.
- No Stripe logic.
- No tax logic.
- No referral logic.
- No payment/invoice sending behavior.
- No customer emails.
- No request creation or status logic.
