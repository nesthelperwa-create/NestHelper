# Duplicate Protection + Helper Rename Update

Files included:
- components/admin/AdminTable.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts

What changed:
1. Duplicate protection
- Repeat Laundry: prevents creating another repeat request from the same original request for the same pickup date.
- Follow-up / recurring services: prevents creating another follow-up request from the same original request for the same visit date.
- If a duplicate exists, the admin UI shows the message and gives you the existing request ID through the existing “Open new request” workflow.

2. Helper rename
- Renames the confusing helper names that said “RepeatLaundry” even though the same helper now supports both laundry and non-laundry follow-up fields.
- This is a naming cleanup only.

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment logic.
- No customer form logic.
- No customer emails.
- No status update logic.
- No pricing or quote presets.
- No automatic recurring generation.

Notes:
- Duplicate protection uses a single-field Firestore lookup by the source request ID, then checks the date/customer in code. This avoids adding new Firestore indexes.
- Existing created repeat/follow-up requests are not modified.
