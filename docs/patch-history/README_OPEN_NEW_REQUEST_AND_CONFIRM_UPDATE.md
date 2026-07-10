# Open New Request + Confirmation Update

Files included:
- components/admin/AdminTable.tsx

What changed:
- Adds a browser confirmation prompt before creating:
  - Repeat Laundry requests
  - Follow-up / recurring service requests
- After a new repeat/follow-up request is created, an “Open new request” button appears.
- Clicking “Open new request” switches the admin popup directly to the new request if the dashboard list has refreshed.
- If the new request has not loaded into the dashboard list yet, it shows a friendly wait-and-click-again message.

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment logic.
- No customer form logic.
- No customer emails.
- No API route logic.
- No request creation logic.
- No status update logic.
- No pricing or quote presets.

This is admin workflow polish only.
