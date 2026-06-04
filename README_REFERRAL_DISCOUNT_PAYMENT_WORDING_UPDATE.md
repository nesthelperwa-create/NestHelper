Referral discount payment wording update

What this update does
- Changes the referred-family landing page heading from "Your family gets money off" to "Your family gets a referral discount."
- When a Family Payment Breakdown credit is applied and the admin fills Quick Checkout, the Stripe checkout item description now says the referral/customer credit was already deducted from the amount being charged.
- Laundry Rescue deposit/minimum checkout from the Family Builder now also notes when a referral/customer credit was already deducted from the deposit/minimum amount.
- Family Stripe invoices keep the negative referral/customer credit line and label it clearly as deducted from the final amount due.
- NestHelper invoice/checkout emails include the same deduction note when a credit is applied.
- No layout redesign, no Firebase rules changes, and no Commercial Reset changes.

Changed files
- app/referrals/page.tsx
- app/api/admin/create-payment-link/route.ts
- app/api/admin/create-family-invoice/route.ts
