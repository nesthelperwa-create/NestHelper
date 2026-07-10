# Recurring Service Follow-Up Build Fix

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts

What changed:
- Fixes the Vercel/Next.js build error:
  Cannot find name 'getServiceLabel'. Did you mean 'getCleanServiceLabel'?
- Replaces getServiceLabel(...) with the existing getCleanServiceLabel(...).

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment logic.
- No customer form logic.
- No recurring/follow-up behavior changes beyond fixing the build typo.
