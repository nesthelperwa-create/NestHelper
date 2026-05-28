# Email admin notification delivery fix

This update changes website admin alerts so they land in the main inboxes you actually check, while still labeling the routed alias in the subject and message body.

## Why this was changed

The previous alias-label update sent admin notifications directly to routed aliases such as `billing@nesthelperwa.com`, `laundry@nesthelperwa.com`, or `support@nesthelperwa.com`.

If alias delivery or filtering is confusing, those admin notifications can be hard to find. Customer confirmation emails may still work because they are sent separately.

## New behavior

Admin notification emails are now sent to:

- `ADMIN_NOTIFICATION_EMAIL` from Vercel, if set
- `hello@nesthelperwa.com`

If `ADMIN_NOTIFICATION_EMAIL` is missing, the site falls back to:

- `nesthelperwa@gmail.com`
- `hello@nesthelperwa.com`

The subject still includes the routed alias, for example:

- `[NestHelper Contact: Billing → billing@] New NestHelper Contact Message`
- `[NestHelper Contact: Laundry → laundry@] New NestHelper Contact Message`

Inside the email, it shows:

- Inbox route
- Website route
- Admin inbox sent to
- Customer reply-to
- Dashboard ID

## Optional Vercel setting

In Vercel, you can set this environment variable:

```txt
ADMIN_NOTIFICATION_EMAIL=nesthelperwa@gmail.com,hello@nesthelperwa.com
```

Then redeploy the site.
