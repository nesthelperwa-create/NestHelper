Admin dashboard page numbers + referral/promo filters

What this update does
- Keeps the existing Work queue and All records / Show all options.
- Keeps 25 records per page as the default.
- Adds clickable page numbers with ellipses so admin can jump directly to a page.
- Keeps Previous / Next controls above and below the table.
- Adds a Referrals filter for service requests:
  - Has referral activity
  - Outgoing share links
  - Referred-family requests
  - Reward / credit activity
  - Available credit noted
- Adds a Promo / credits filter for service requests:
  - Any promo / discount / credit
  - Has promo code
  - Founding / beta
  - Referral credit
  - Saved customer credit
  - Discount line
- Does not change public pages, payment logic, referral logic, Firestore rules, or Commercial Reset.

Changed file
- components/admin/AdminTable.tsx
