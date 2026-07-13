# Checkout Brand Route Build Fix

Files included:
- app/pay/[token]/route.ts
- app/checkout/page.tsx

What changed:
- Rebuilds app/pay/[token]/route.ts from the known-good smart-checkout safety route.
- Replaces only the customer-facing htmlPage helper with the branded NestHelper checkout card.
- Fixes the Vercel build error caused by a duplicated leftover htmlPage parameter/body block.
- Keeps the app/checkout/page.tsx branded confirmation page from the previous patch.

What did NOT change:
- No Stripe amount logic.
- No smart checkout token logic.
- No double-payment guard logic.
- No webhook logic.
- No tax rules.
- No pricing math.
- No admin workflow logic.
