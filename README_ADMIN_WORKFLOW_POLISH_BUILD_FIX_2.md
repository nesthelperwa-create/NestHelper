# Admin Workflow Polish Build Fix 2

Files included:
- components/admin/FamilyPaymentBreakdownBuilder.tsx

What changed:
- Fixes the remaining build error caused by an accidental wording replacement inside another internal variable.
- Restores:
  - nextPlanned cadence -> nextCadence
  - recurringPlanned cadence -> recurringCadence
  - setRecurringPlanned cadence -> setRecurringCadence
- Keeps the visible UI label as “Planned cadence.”

What did NOT change:
- No pricing math.
- No Stripe logic.
- No tax logic.
- No referral logic.
- No payment/invoice sending behavior.
- No customer emails.
- No request creation or status logic.
