# Smart Checkout Double-Pay Guard Update

Files included:
- app/pay/[token]/route.ts
- app/api/admin/create-payment-link/route.ts

Why this patch exists:
- Testing showed a smart checkout link could create a fresh Stripe checkout after the first checkout had already been paid, if the NestHelper request status had not updated yet.
- This could allow duplicate payment attempts.

What changed:
- The smart /pay/[token] route now checks Stripe's current Checkout Session.
- If Stripe says the latest session is already paid/complete, NestHelper:
  - Does not create a new Stripe Checkout Session.
  - Updates the request as paid.
  - Shows the customer a friendly already-paid message.
- The admin create smart checkout route now blocks creating a new checkout if the request already looks paid/completed.

What did NOT change:
- No Stripe webhook logic.
- No pricing math.
- No invoice logic.
- No tax rules.
- No referral amounts.
- No old raw Stripe link behavior.
