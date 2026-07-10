# Property-Dependent Quick Checkout Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts
- lib/campaignAttribution.ts

What changed:
- For property-dependent services, Quick Checkout now defaults to a reviewed/custom amount instead of “Standard package price.”
- The “Standard package price” option is hidden for:
  - Whole Home Cleaning / Whole Home Reset
  - Specific Area(s) Reset
  - Move-In / Move-Out Cleaning
  - Move Prep & Home Reset
- Parent Reset, Laundry Rescue, and other package-like services can still use standard package pricing where it makes sense.
- Adds clearer helper text explaining that cleaning/reset pricing depends on property, condition, scope, photos, pets, and add-ons.
- Updates related user-facing admin wording from “payment breakdown” to “draft estimate” where appropriate.

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment sending behavior.
- No invoice sending behavior.
- No customer emails.
- No pricing math.
- No public request form logic.
- No recurring generation.
