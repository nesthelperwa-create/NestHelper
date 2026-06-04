# NestHelper referral credit sync + admin status dropdown update

This update keeps the public layout/styling the same and focuses on admin efficiency and referral-credit reliability.

## What changed

- Adds an admin-only endpoint: `/api/admin/sync-customer-credits`.
- Adds a **Sync saved credits** button inside the Family Referrals admin box.
- The sync button checks the selected customer email for completed referrals and creates any missing `customerCredits` record.
- This repairs older referral rewards where the reward email was sent before the customer-credit ledger was added.
- Status dropdowns in the admin table Actions column and details modal now use the alphabetized status list.
- Cleans up two small syntax artifacts in the uploaded current files.

## How to use after deploy

1. Open the original referring family/customer request in admin.
2. In the Family Referrals box, click **Sync saved credits**.
3. Reopen or refresh the future request from that same customer email.
4. The Family Payment Breakdown should show the available saved credit.
5. Apply/save the credit before sending checkout or invoice.

## Firestore rules

No Firestore rules deploy is required for this update if the previous `customerCredits` rules were already deployed.
