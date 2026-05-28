# NestHelper email inbox routing labels

This update makes admin notification emails easier to identify when multiple aliases route into the same mailbox.

## What changed

Website-generated admin emails now route to the matching mailbox and include a clear subject prefix, for example:

- `[NestHelper Contact: Billing → billing@] New NestHelper Contact Message`
- `[NestHelper Contact: Laundry → laundry@] New NestHelper Contact Message`
- `[NestHelper Booking → booking@] New NestHelper Service Request`
- `[NestHelper Laundry → laundry@] New NestHelper Service Request`
- `[NestHelper Helpers → helpers@] New NestHelper Helper Application`
- `[NestHelper Partners → partners@] New NestHelper Partner / Contractor Application`

The email body also shows:

- Inbox route
- Website routed to
- Customer reply-to
- Dashboard ID

This keeps the public website clean while making the shared inbox easier to manage.
