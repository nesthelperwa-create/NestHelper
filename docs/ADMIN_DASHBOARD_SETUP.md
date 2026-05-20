# NestHelper Admin Dashboard + Email Notification Setup

This update adds a private admin dashboard and email notifications for:

- Customer service requests
- Helper applications
- Independent contractor / partner applications
- Contact messages

## 1. Copy files into your website

Unzip this update package and copy the folders into the root of your existing Next.js project:

```powershell
Copy-Item -Recurse -Force .\app .\your-nesthelper-site\
Copy-Item -Recurse -Force .\components .\your-nesthelper-site\
Copy-Item -Recurse -Force .\lib .\your-nesthelper-site\
Copy-Item -Recurse -Force .\firebase .\your-nesthelper-site\
```

Or drag and drop the folders into the same location as your existing `app`, `components`, `lib`, and `firebase` folders.

## 2. Install required packages

From your project root:

```powershell
npm install firebase firebase-admin resend
```

## 3. Enable Firebase Authentication

In Firebase Console:

1. Go to Authentication
2. Click Get Started
3. Enable Email/Password provider
4. Add your admin user manually, such as `hello@nesthelperwa.com`

Do not add public sign-up links. This is admin-only.

## 4. Add environment variables

Copy values from `.env.admin.example` into your existing `.env.local`.

You need:

- Firebase web app config
- Firebase Admin SDK service account values
- Resend API key
- Admin emails
- Admin notification email

For `FIREBASE_PRIVATE_KEY`, keep the quotes and `\n` line breaks.

## 5. Update Firestore rules

Open `firebase/firestore.rules` and replace:

```text
REPLACE_WITH_YOUR_ADMIN_EMAIL@gmail.com
```

with your actual admin email.

Then deploy rules:

```powershell
firebase deploy --only firestore:rules
```

## 6. Connect public forms to the API routes

Your public forms should submit JSON to these endpoints:

```text
/api/submit-request
/api/submit-helper-application
/api/submit-partner-application
/api/submit-contact
```

Example:

```ts
await fetch('/api/submit-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});
```

## 7. Test locally

```powershell
npm run dev
```

Open:

```text
http://localhost:3000/admin
```

You should see a login page. Sign in with the Firebase admin user you created.

## 8. Dashboard URLs

These are private and should not be linked from the public header/footer:

```text
/admin
/admin/requests
/admin/helpers
/admin/partners
/admin/contact
```

## 9. Security notes

- Public visitors cannot read the dashboard.
- Dashboard requires Firebase Auth.
- Firestore read/update access is limited to the admin emails in your Firestore rules.
- Public form submissions go through Next.js API routes using Firebase Admin SDK.
- Do not collect SSNs, ID photos, or sensitive background-check documents on the website.

## 10. Recommended statuses

Service requests:

```text
New → Reviewed → Approved → Checkout Sent → Paid → Scheduled → Completed
```

Helper applications:

```text
New → Reviewing → Interview → Background Check Needed → Approved
```

Partner applications:

```text
New → Reviewing → Need Documents → Approved Partner
```
