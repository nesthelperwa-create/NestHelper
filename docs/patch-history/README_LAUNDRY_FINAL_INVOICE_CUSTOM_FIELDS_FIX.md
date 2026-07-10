# Laundry Final Invoice Custom Fields Fix

Files included:
- app/api/admin/create-laundry-final-balance/route.ts

What changed:
- Fixes the Stripe error: “Array custom_fields exceeded maximum allowed elements.”
- The Laundry final invoice was sending too many Stripe custom fields.
- The final invoice now keeps only the most useful customer-facing custom fields:
  - Dry weight
  - Included weight
  - Additional weight
  - Final collection
- Details like additional rate, minimum already paid, and intro tax status are still preserved in Stripe metadata / dashboard fields.

What did NOT change:
- No Stripe prices.
- No tax math.
- No final balance math.
- No public request forms.
- No admin layout.
- No Firebase rules.
- No referral amounts.
- No email wording.

After deploy:
- Reopen the Laundry request and try “Create + email final invoice” again.
- The previous failed attempt did not successfully create/send the invoice because Stripe rejected it before completion.
