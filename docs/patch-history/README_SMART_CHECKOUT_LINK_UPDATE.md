# Smart Checkout Link Update

Files included:
- components/admin/AdminTable.tsx
- app/api/admin/create-payment-link/route.ts
- lib/sendPaymentLinkEmail.ts
- app/pay/[token]/route.ts

What changed:
- Admin quick checkout wording is updated to “smart checkout.”
- New quick checkout emails send a NestHelper customer checkout link instead of the raw Stripe Checkout Session URL.
- The NestHelper link looks like `/pay/[token]`.
- When a customer clicks the NestHelper link:
  - If the latest Stripe Checkout Session is still open, NestHelper redirects them to Stripe.
  - If the Stripe session is expired/missing, NestHelper creates a fresh Stripe Checkout Session and redirects them to the new Stripe checkout.
  - If the request already looks paid/completed, NestHelper shows a friendly already-paid message.
- Admin still stores the raw Stripe URL as `stripeCheckoutUrl` for backup/internal use.
- Admin shows the customer checkout link first and the raw Stripe URL as backup only.
- Existing raw Stripe links already sent to customers are not changed; they keep working until Stripe expires them.
- This patch also keeps/adds the simple “Delete request permanently” admin button with confirmation, using the existing backend delete route.

What did NOT change:
- No Stripe webhook logic.
- No invoice creation logic.
- No pricing math.
- No referral amounts.
- No tax calculation rules.
- No public request form logic.
- No existing raw Stripe link behavior for links already sent.
