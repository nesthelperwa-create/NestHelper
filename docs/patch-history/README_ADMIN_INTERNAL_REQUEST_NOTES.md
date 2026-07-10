# Admin Internal Request Notes + Laundry Bag Tracking

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx
- app/api/admin/update-request-notes/route.ts

What changed:
- Adds an admin-only “Internal notes” section inside the service request popup.
- Adds a Shortcut Map link called “Bags/notes” for Laundry Rescue and “Admin notes” for other requests.
- For every service request, Leo/Gen can save private admin notes.
- For Laundry Rescue requests, Leo/Gen can also track:
  - Laundry bags used
  - Bags returned
  - Bags still out
  - Bag note
- The notes are saved to Firestore through a protected admin API route.
- Customers do not see these notes and no email is sent.

Example use:
- Used 3 NestHelper bags.
- Customer returned 1.
- Need 2 bags back at delivery.

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No Firebase rules.
- No public request form.
- No checkout/invoice creation.
- No status email logic.
- No webhook behavior.
- No pricing or quote presets.

This is an admin-only tracking patch.
