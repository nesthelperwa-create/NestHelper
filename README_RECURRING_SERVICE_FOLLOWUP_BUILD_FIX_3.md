# Recurring Service Follow-Up Build Fix 3

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts

What changed:
- Fixes the TypeScript build error:
  Argument of type 'AdminDoc | null' is not assignable to parameter of type 'AdminDoc'.
- Updates the follow-up service title fallback so getCleanServiceLabel only runs when selected is not null:
  selected ? getCleanServiceLabel(selected) : ""

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment logic.
- No customer form logic.
- No recurring/follow-up behavior changes beyond fixing the nullable selected type issue.
