# Recurring Service Follow-Up Build Fix 2

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts

What changed:
- Fixes the second Vercel/Next.js build error:
  Argument of type 'string' is not assignable to parameter of type 'AdminDoc'.
- Updates the follow-up service title fallback from:
  getCleanServiceLabel(getServiceKey(selected))
  to:
  getCleanServiceLabel(selected)

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment logic.
- No customer form logic.
- No recurring/follow-up behavior changes beyond fixing the build typing issue.
