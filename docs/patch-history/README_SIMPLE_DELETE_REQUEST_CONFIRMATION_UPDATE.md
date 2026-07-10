# Simple Delete Request Confirmation Update

Files included:
- components/admin/AdminTable.tsx

What changed:
- Adds a “Delete request permanently” button in the request status section.
- Shows a browser warning confirmation before deleting.
- Uses the existing `/api/admin/delete-record` backend route.
- Uses the existing backend protection that blocks deletion for paid, scheduled, completed, invoiced, checkout-linked, or referral-linked requests.
- Removes the deleted request from the admin list after the delete succeeds.

Important behavior:
- Delete is intended for test, spam, duplicate, or accidental unpaid requests.
- Archive remains the safer option for real customer records.

What did NOT change:
- No backend API route changes.
- No Stripe logic.
- No pricing math.
- No tax logic.
- No referral logic.
- No customer emails.
- No archive behavior.
