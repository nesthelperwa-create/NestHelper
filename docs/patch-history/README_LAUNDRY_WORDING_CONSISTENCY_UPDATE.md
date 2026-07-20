# Laundry Wording Consistency Update

Files included:
- app/api/admin/create-family-invoice/route.ts
- app/api/admin/create-laundry-final-balance/route.ts
- app/api/admin/create-payment-link/route.ts
- app/api/stripe/webhook/route.ts
- app/checkout/page.tsx
- app/faq/page.tsx
- app/pay/[token]/route.ts
- app/services/page.tsx
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx
- components/ServiceCard.tsx
- docs/CUSTOMER_MESSAGES.md
- docs/LAUNCH_CHECKLIST.md
- docs/LAUNDRY_FINAL_BALANCE.md
- docs/PAYMENT_APPROVAL_FLOW.md
- docs/STRIPE_SETUP.md
- lib/policies.ts
- lib/sendLaundryFinalBalanceEmail.ts
- lib/sendPaymentLinkEmail.ts
- lib/sendPaymentReceivedEmail.ts
- lib/services.ts

What changed:
- Replaces old Laundry Rescue wording like “dry-weighed at pickup,” “dry weigh-in,” and “after weigh-in.”
- Uses consistent wording that laundry is washed, dried, folded, and then calculated by final dry weight.
- Updates customer-facing checkout labels to say “Auto-charge saved card after final dry weight is confirmed.”
- Updates admin labels from “Dry weight lbs” to “Final dry weight lbs.”
- Updates final balance email/payment received email wording to match the real process.
- Updates active internal docs so Leo/Gen’s workflow references final dry weight after washing, drying, and folding.

What did NOT change:
- No Stripe logic.
- No checkout session logic.
- No smart checkout token logic.
- No webhook behavior.
- No payment amount logic.
- No tax rules.
- No pricing math.
- No admin workflow logic.
- No public request form logic.
