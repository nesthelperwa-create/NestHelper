# Repeat Laundry Request V2 Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx
- app/api/admin/create-repeat-laundry-request/route.ts

What changed:
- Replaces the earlier repeat laundry patch with a cleaner v2 flow.
- Adds a “Repeat” shortcut in the admin request popup for Laundry Rescue requests.
- The repeat section now pre-fills the old saved laundry preferences.
- Leo/Gen can update the repeat details before creating the new request:
  - Next pickup date
  - Pickup window
  - Pickup spot
  - Return spot
  - Detergent preference
  - Laundry amount
  - Drying instructions
  - Folding instructions
  - Special instructions for this pickup
  - Add-on / extra item note
  - Internal repeat note
- Clicking “Create repeat request” creates a NEW service request row in the admin dashboard.
- The old completed request stays unchanged.

The new repeat request copies:
- Customer name, email, phone
- Address and access notes
- Pickup/return spot unless overridden
- Laundry preferences unless overridden
- Detergent/special handling notes unless overridden
- Basic campaign/how-found-us tracking

The new repeat request resets:
- Status to “Repeat Scheduled”
- Payment status to “Not Paid”
- Laundry payment status to “Not Paid”
- Dry weight/final balance/payment links/invoice links
- Laundry bag tracking
- Completion/payment history

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
1. Customer says yes to another pickup.
2. Open their completed Laundry Rescue request.
3. Click “Repeat.”
4. Review the copied preferences.
5. Change anything for this pickup, like child-safe detergent or add-on notes.
6. Click “Create repeat request.”
7. Open the new request row and send the normal Laundry Rescue payment link.
