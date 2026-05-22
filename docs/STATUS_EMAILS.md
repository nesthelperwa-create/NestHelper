# NestHelper Status Emails

This update adds controlled customer status notifications from the admin request detail modal.

## What changed

- The quick status dropdown in the table remains an internal status update.
- Open a request with **View** to access **Status + customer update**.
- Admin can choose a status, add an optional customer note, and decide whether to send the customer an email.
- Major customer-facing statuses default to sending an email:
  - Approved
  - Scheduled
  - Declined
  - Needs Info
  - Follow-Up Needed
  - Canceled
- Internal statuses can be updated without emailing the customer.
- Stripe webhook now sends a NestHelper-branded **Payment received** email when a checkout session is completed.

## Recommended use

Use customer email notifications for statuses the customer needs to know about:

- Declined
- Needs Info / Follow-Up Needed
- Approved
- Scheduled
- Canceled

Use internal-only updates for statuses that are just for tracking:

- New
- Reviewed
- Completed

Payment link emails and payment received emails are handled separately.
