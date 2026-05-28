# NestHelper mobile-safe email templates

This update makes NestHelper HTML emails easier to read on phones.

## What changed

- Replaced two-column detail tables with stacked mobile-friendly detail cards.
- Reduced outer padding so the email has more usable width on small screens.
- Added wrapping styles for long request IDs, links, customer notes, and message text.
- Made buttons mobile-safe so they do not force the email wider than the screen.
- Applied the same mobile-safe layout to customer emails and admin notification emails.

## Files changed

- `lib/sendCustomerConfirmationEmail.ts`
- `lib/sendPaymentLinkEmail.ts`
- `lib/sendLaundryFinalBalanceEmail.ts`
- `lib/sendPaymentReceivedEmail.ts`
- `lib/sendStatusUpdateEmail.ts`
- `lib/sendAdminEmail.ts`
- `lib/emailRouting.ts` included for safety/reference
