Admin dashboard pagination update

What this update does
- Keeps the existing Work queue / All records options.
- Shows up to 25 matching records per page by default for service requests, contact messages, helper applications, partner applications, and other admin lists that use AdminTable.
- Adds Previous / Next controls above and below the table.
- Adds a Per page selector with 25 or Show all.
- Search, filters, queue buttons, service filters, payment/referral/admin actions, and details modals are unchanged.

Changed file
- components/admin/AdminTable.tsx

No Firebase rules deploy is needed for this update.
