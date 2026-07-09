# Laundry Referral $10 Update

Files included:
- lib/referrals.ts
- app/api/admin/create-family-invoice/route.ts
- app/api/admin/update-referral/route.ts
- app/referrals/page.tsx
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx

What changed:
- Laundry Rescue referral credit changed from $15 to $10.
- Other eligible family services stay at $25.
- Commercial Reset remains excluded from family referrals.
- Family invoice / Laundry deposit checkout safety check now uses the shared referral program values instead of a hardcoded laundry $15 fallback.
- Admin referral defaults and helper wording now show Laundry = $10, other eligible family services = $25.
- Public referral page copy now says Laundry Rescue may be $10 instead of $25.

What I checked:
- The source-of-truth referral program constant is now laundryCredit: 10.
- The invoice route no longer has the hardcoded “laundry = 15” fallback.
- The admin update-referral route uses the referral program constant.
- The admin popup cleanup from the latest patch is preserved.

Important:
- This changes referral amounts going forward.
- Existing already-created referral credits in Firestore will not be automatically changed. If an old $15 laundry referral credit already exists, it may need to be manually adjusted or handled case-by-case.

No Stripe product prices, tax math, Firebase rules, public request form validation, webhook logic, or laundry pricing were changed.
