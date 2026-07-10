# Admin Workflow Polish Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts
- lib/campaignAttribution.ts

What changed:

1. Draft estimate wording cleanup
- Makes the family builder wording consistently feel like an internal draft estimate tool.
- Replaces confusing labels such as payment breakdown / customer-facing breakdown / calculated total with draft estimate wording.
- Clarifies again that nothing is sent to the customer automatically.

2. Recurring wording cleanup
- Changes recurring wording to make clear it is not auto-billing or auto-activating.
- “Recurring status” is now “Recurring plan.”
- “Not recurring” is shown as “Not activated yet.”
- “Recurring rate / visit” is now “Future recurring rate / visit.”

3. Safer follow-up creation
- Adds a “Create as” selector in the non-laundry follow-up section:
  - One-time follow-up
  - Recurring visit
- The original request’s cadence can still prefill as a note, but the new request is only marked recurring when admin chooses “Recurring visit.”
- The confirmation message now reflects whether you are creating a one-time follow-up or recurring request.

4. Campaign tracking
- Keeps campaign attribution expiration at 24 hours, which is best while testing.

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment/invoice sending behavior.
- No customer emails.
- No pricing math.
- No public request form required fields.
- No automatic recurring generation.
- No deletion logic.
