# Repeat Laundry Request Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx
- app/api/admin/create-repeat-laundry-request/route.ts

What changed:
- Adds a “Repeat” shortcut in the admin request popup for Laundry Rescue requests.
- Adds a “Repeat laundry” section where Leo/Gen can choose the next pickup date, pickup window, and an internal note.
- Clicking “Create repeat request” creates a NEW service request row in the admin dashboard.
- The old completed request stays unchanged.

The new repeat request copies:
- Customer name, email, phone
- Address and access notes
- Pickup/return spot
- Laundry preferences
- Detergent/special handling notes when saved
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
4. Choose next pickup date/window.
5. Click “Create repeat request.”
6. Open the new request row and send the normal Laundry Rescue payment link.
