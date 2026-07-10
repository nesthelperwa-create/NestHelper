# Delete Request Confirmation Update

Files included:
- components/admin/AdminTable.tsx
- app/api/admin/delete-record/route.ts

What changed:
- Adds a “Delete request permanently” button to the request status section.
- Shows a strong browser warning popup before deleting.
- Removes the deleted request from the admin list after successful deletion.
- Shows clear success/error feedback in admin.
- Keeps deletion blocked for records that look paid, scheduled, completed, or connected to payment, invoice, checkout, or referral data.
- Keeps Archive as the safer default for real customer records.

Important behavior:
- Delete is intended only for test, spam, duplicate, or accidental unpaid requests.
- Paid, scheduled, completed, invoiced, checkout-linked, or referral-linked requests should be archived/closed instead of deleted.
- The backend still enforces the protection even if someone tries to bypass the button.

What did NOT change:
- No Stripe logic.
- No pricing math.
- No tax logic.
- No referral amounts.
- No customer emails.
- No request form logic.
- No archive behavior.
