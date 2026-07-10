# Family Builder Draft Wording Update

Files included:
- components/admin/FamilyPaymentBreakdownBuilder.tsx

What changed:
- Renames the family builder header from “Family Payment Breakdown Builder” to “Draft Estimate Builder.”
- Clarifies that the builder creates an internal draft estimate and nothing is sent automatically.
- Changes “reviewed quote” wording to “draft estimate” in default line item labels.
- Changes “Calculated total” to “Draft total.”
- Changes “Customer-facing breakdown” to “Customer-facing draft breakdown.”

What did NOT change:
- No pricing math.
- No Stripe logic.
- No tax logic.
- No referral logic.
- No payment or invoice creation behavior.
- No customer emails.
- No request creation or status logic.

This is wording/UI clarity only.
