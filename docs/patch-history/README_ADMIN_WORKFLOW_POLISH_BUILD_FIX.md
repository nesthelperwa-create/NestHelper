# Admin Workflow Polish Build Fix

Files included:
- components/admin/FamilyPaymentBreakdownBuilder.tsx

What changed:
- Fixes the build error caused by an accidental wording replacement inside a React variable name.
- Restores the code variable name to recurringCadence / setRecurringCadence.
- Keeps the visible UI label as “Planned cadence.”

What did NOT change:
- No pricing math.
- No Stripe logic.
- No tax logic.
- No referral logic.
- No payment/invoice sending behavior.
- No customer emails.
- No request creation or status logic.
