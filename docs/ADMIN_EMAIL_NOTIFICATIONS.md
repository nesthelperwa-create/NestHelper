# Admin email notifications

New public form submissions call `sendAdminEmail()` after the Firestore document is saved.

Notification recipient order:

1. `ADMIN_NOTIFICATION_EMAIL`
2. `CUSTOMER_SUPPORT_EMAIL`
3. `NEXT_PUBLIC_CONTACT_EMAIL`
4. `hello@nesthelperwa.com`

Recommended Vercel Production env vars:

```env
ADMIN_NOTIFICATION_EMAIL=hello@nesthelperwa.com
CUSTOMER_SUPPORT_EMAIL=hello@nesthelperwa.com
NOTIFICATION_FROM_EMAIL=NestHelper <notifications@nesthelperwa.com>
```

After changing Vercel env vars, redeploy the site.

To test:

1. Submit `/contact`
2. Submit `/request?service=parent-reset-2hr`
3. Check `hello@nesthelperwa.com` inbox and spam/promotions
4. Check Vercel logs for `sendAdminEmail` or Resend errors if no email arrives
5. Check Resend logs for delivery status
