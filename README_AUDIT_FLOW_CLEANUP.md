# NestHelper flow cleanup audit update

This update makes low-risk flow/security/clarity cleanup only. It does not redesign layout or styling.

Changed areas:
- Referral wording now consistently says eligible family services instead of only Parent Reset / Family Reset / Helper Block.
- Referral policy now matches the implemented program: Parent Reset, Family Reset, Helper Block, Errand Helper, and Laundry Rescue are eligible family services; Commercial Reset remains excluded.
- Referral claim records now store the expected new-customer/referrer credit amount so the admin payment builder has a cleaner source of truth.
- Referral reward completion check now recognizes service aliases/title fallbacks instead of relying only on the raw service ID.
- Firestore rules file no longer contains the placeholder admin email and includes the two NestHelper admin emails previously used.
- Removed a duplicate response field in the quick checkout API.

Deploy notes:
1. Apply files.
2. Commit and push.
3. Redeploy Firestore rules because firebase/firestore.rules changed.

Commercial Reset layout, form, quote builder, invoice flow, and payment flow were not changed.
