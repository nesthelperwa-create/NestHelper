# Post Review Safety Update

Files included:
- components/admin/AdminTable.tsx
- app/api/admin/delete-record/route.ts
- app/api/admin/create-payment-link/route.ts
- app/pay/[token]/route.ts

What changed:
- Replaces broad `includes("paid")` checks with a safer paid-status helper so `Unpaid` is not treated as paid.
- Applies the safer paid check to:
  - admin queue/filter logic
  - bookkeeping paid detection
  - delete protection
  - smart checkout paid detection
  - admin create-checkout blocking
- Smart checkout now blocks closed/canceled/archived/inactive requests instead of refreshing Stripe.
- Admin create-checkout also blocks closed/canceled/archived/inactive requests.
- If a paid Laundry intro session is detected by the smart link before the webhook finishes, it now records the status as `Deposit Paid - Final Pending` and updates laundry payment fields more consistently.

Why this matters:
- Prevents accidental smart checkout refresh for closed/canceled requests.
- Prevents false positives where `Unpaid` was interpreted as `paid` because of substring matching.
- Makes the smart checkout/deletion/payment filters safer.

What did NOT change:
- No pricing math.
- No tax rules.
- No Stripe line item amounts.
- No referral amounts.
- No email templates.
- No public request form logic.
