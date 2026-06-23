# Status email result visibility fix

This update makes the admin dashboard clearly show whether a customer status email was sent, failed, skipped, or not requested.

## What changed

- The **Send customer email notification** checkbox now says it will show **Sent / Failed / Skipped** after saving.
- After clicking **Update status + notify customer**, a visible **Email result from this update** box appears immediately.
- The request details keep a **Last customer status email** card with:
  - Email sent / failed / skipped
  - Attempt time
  - Recipient email
  - Resend ID when available
  - Failure or skipped reason when applicable
- The row-level mini badge is updated immediately too, without waiting for Firestore refresh.
- **Quote Sent** and **Quote Approved** now automatically check the customer notification box.
- The API response now returns a clear email result message, attempted time, and recipient.
- Status updates no longer accidentally clear admin notes when the frontend does not send notes.

## Important note

“Email sent” means Resend accepted the email request. It does not guarantee the customer opened it or that it avoided spam.

Older customer emails sent before this logging feature may still show **No email logged** because the delivery result was not saved at the time.
