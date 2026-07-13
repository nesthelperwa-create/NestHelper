# Laundry Hide Checkout Dropdown Update

Files included:
- components/admin/AdminTable.tsx

What changed:
- Hides the Smart Checkout amount dropdown for Laundry Rescue.
- Shows a dedicated Laundry card:
  - “Standard $59 intro minimum selected”
  - Explains this is the normal Laundry flow.
- Adds an intentional advanced button:
  - “Advanced: use custom deposit amount”
- Custom deposit amount fields only show after the advanced button is clicked.
- Adds a button to return to the standard $59 intro minimum.

What did NOT change:
- No Stripe logic.
- No smart checkout token logic.
- No double-payment guard logic.
- No tax calculation rules.
- No Laundry final balance/invoice logic.
- No pricing math.
- No customer email logic.
