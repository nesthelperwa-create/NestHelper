# Customer status email delivery visibility

This update makes the admin dashboard clearer when a status update is also emailed to a customer.

## What changed

- The `/api/admin/update-status` route now records the result of the customer status email attempt.
- Successful status emails are saved with:
  - `lastStatusEmailDelivery: "Sent"`
  - `lastStatusEmailSentAt`
  - `lastStatusEmailAttemptedAt`
  - `lastStatusEmailStatus`
  - `lastStatusEmailNote`
  - `lastStatusEmailRecipient`
  - `lastStatusEmailProviderId` when Resend returns one
- Failed status emails are saved with:
  - `lastStatusEmailDelivery: "Failed"`
  - `lastStatusEmailError`
- Skipped status emails are saved with:
  - `lastStatusEmailDelivery: "Skipped"`
  - `lastStatusEmailError`

## Dashboard behavior

In the request details modal, the **Status + customer update** card now shows a **Customer email delivery** panel. This tells the admin whether the last customer status email was sent, failed, skipped, or not logged yet.

The request list also shows a small customer email badge when a saved email delivery result exists.

## Important note

This confirms that the email was accepted by the email provider/API. It does not guarantee the customer opened the email or that it avoided the customer’s spam folder.
