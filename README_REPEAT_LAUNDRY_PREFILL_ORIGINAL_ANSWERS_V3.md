# Repeat Laundry Prefill Original Answers V3 Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx
- app/api/admin/create-repeat-laundry-request/route.ts

What changed:
- Improves the Repeat Laundry section so editable fields prefill from the original customer answers when available.
- It now checks both clean saved fields and likely raw submitted/form answer containers.
- This helps when the old request shows the customer answers in the dashboard, but the repeat fields were blank because the field names did not match the new repeat form exactly.
- You can still edit any field before clicking “Create repeat request.”

Fields improved:
- Pickup window
- Pickup spot
- Return spot
- Detergent preference
- Drying instructions
- Folding instructions
- Laundry amount
- Special instructions
- Add-on / bulky item notes

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No Firebase rules.
- No public request form.
- No checkout/invoice creation logic.
- No status email logic.
- No pricing or quote presets.

Recommended flow:
1. Open the original completed Laundry Rescue request.
2. Go to Repeat.
3. Confirm the original answers loaded into the editable repeat fields.
4. Change anything for this pickup, like child-safe detergent or reusable bag notes.
5. Click Create repeat request.
6. Open the new request row and send the normal Laundry Rescue payment link.
