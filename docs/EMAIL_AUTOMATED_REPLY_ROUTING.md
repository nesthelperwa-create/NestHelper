# Automated Outlook reply routing for NestHelper

This update makes website-generated admin notices land in the matching NestHelper mailbox so Outlook can reply from the right business address.

## What the website now routes

- Contact/general messages → `hello@nesthelperwa.com`
- Contact/support messages → `support@nesthelperwa.com`
- New regular service requests → `booking@nesthelperwa.com`
- Laundry Rescue service requests → `laundry@nesthelperwa.com`
- Billing/payment contact messages → `billing@nesthelperwa.com`
- Stripe payment alerts → `billing@nesthelperwa.com`, or `laundry@nesthelperwa.com` for Laundry/deposit/final-balance alerts
- Helper applications → `helpers@nesthelperwa.com`
- Partner applications → `partners@nesthelperwa.com`

## Why this helps Outlook

Outlook chooses the reply sender based on the mailbox you are replying from. If every website admin notice goes to `hello@nesthelperwa.com`, Outlook will usually reply from `hello@nesthelperwa.com`.

After this update, a booking notice goes to the Booking mailbox, a laundry notice goes to the Laundry mailbox, and so on. When you reply from that shared mailbox, the customer should see the matching address.

## Microsoft 365 / Outlook setup still required

Create or confirm these as shared mailboxes in Microsoft 365:

- `booking@nesthelperwa.com` — display name: `NestHelper Booking`
- `billing@nesthelperwa.com` — display name: `NestHelper Billing`
- `laundry@nesthelperwa.com` — display name: `NestHelper Laundry`
- `helpers@nesthelperwa.com` — display name: `NestHelper Helpers`
- `partners@nesthelperwa.com` — display name: `NestHelper Partners`

Give your main Outlook user **Full Access** and **Send As** permission for each shared mailbox.

## Reply test

1. Submit a test request using Laundry Rescue.
2. Confirm the admin notice lands in `laundry@nesthelperwa.com`.
3. Reply from Outlook while viewing that shared mailbox.
4. Send the reply to a personal test email.
5. Confirm the customer sees `NestHelper Laundry <laundry@nesthelperwa.com>`.

Repeat with a regular Parent Reset request and confirm it replies from `NestHelper Booking <booking@nesthelperwa.com>`.

## Important

The code can route emails and set sender/reply headers for automated Resend emails. Manual replies are controlled by Outlook permissions and the mailbox you reply from.
