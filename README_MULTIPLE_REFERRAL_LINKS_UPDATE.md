# NestHelper multiple one-time referral links update

This update lets admin generate another one-time family referral link for the same completed family customer.

## What changed

- Each referral link remains one-time use.
- Admin can still resend/copy the latest link.
- If the same original family wants to refer another family, admin can click **Create + email another one-time link**.
- The latest link is shown at the top of the referral box.
- The service request keeps a small `outgoingReferralHistory` list/count so the admin can see how many one-time links have been generated for that family.
- Public referral wording and policy wording now explain that NestHelper may generate additional one-time links at its discretion.
- Commercial Reset remains excluded.

## Files changed

- `lib/referrals.ts`
- `app/api/admin/create-referral-link/route.ts`
- `components/admin/AdminTable.tsx`
- `app/referrals/page.tsx`
- `lib/policies.ts`
- `lib/sendReferralShareEmail.ts`

No Firebase rules deploy is required for this update unless you have not already deployed the customer credits/referral rules from the earlier update.
