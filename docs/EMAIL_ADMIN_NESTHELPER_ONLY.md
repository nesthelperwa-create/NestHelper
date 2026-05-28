# NestHelper-only admin notification inbox

This update sends website admin notifications only to the NestHelper mailbox:

- `hello@nesthelperwa.com`

The email subject and body still show the route, for example:

- `[NestHelper Contact: Billing → billing@] New NestHelper Contact Message`
- `[NestHelper Contact: Laundry → laundry@] New NestHelper Contact Message`
- `[NestHelper Requests → requests@] New NestHelper Service Request`

This helps you avoid accidentally replying from `nesthelperwa@gmail.com` while still making the type of message easy to identify.

## Vercel environment variable

For the cleanest setup, set this in Vercel:

```txt
ADMIN_NOTIFICATION_EMAIL=hello@nesthelperwa.com
```

Then redeploy the site.
