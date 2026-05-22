# Admin email notifications

New public form submissions and paid Stripe checkouts call `sendAdminEmail()` so NestHelper gets an admin alert after important customer actions.

Admin alerts are sent to `ADMIN_NOTIFICATION_EMAIL`. If that is missing, this site falls back to `nesthelperwa@gmail.com`.

Recommended Vercel Production env vars:

```env
ADMIN_NOTIFICATION_EMAIL=nesthelperwa@gmail.com
CUSTOMER_SUPPORT_EMAIL=hello@nesthelperwa.com
NOTIFICATION_FROM_EMAIL=NestHelper <notifications@nesthelperwa.com>
```

After changing Vercel env vars, redeploy the site.

To test:

1. Submit `/contact`
2. Submit `/request?service=parent-reset-2hr`
3. Check `nesthelperwa@gmail.com` inbox and spam/promotions
4. Complete a Stripe test checkout and confirm the admin payment alert arrives at `nesthelperwa@gmail.com`
5. Check Vercel logs for `sendAdminEmail` / `Admin payment notification email failed`, then check Resend logs for delivery status
