# Launch Rewards prelaunch test mode

This admin-only preview tests the live wheel animation, Firebase App Check token, secure server result, idempotency, and result display before the public launch date.

## Safety boundaries

- Only an allowlisted NestHelper admin can enable it.
- The signed HttpOnly cookie is bound to the current browser device and expires after two hours.
- Test spins use `/api/rewards/test-spin`, not the live prize endpoint.
- Test records are stored in `launchRewardTestSpins` and `launchRewardTestSpinRequests`.
- Test results have no public token, cannot be redeemed, and do not affect live odds, spin limits, or the monthly Parent Reset limit.
- This wheel preview intentionally skips customer SMS/email verification, so it does not create production participant or identity-lock records and does not incur verification messages.

## Use

1. Sign in at `/admin/rewards`.
2. Select the prize to preview.
3. Choose **Enable test mode**.
4. Choose **Open test wheel**.
5. Run one or more test spins.
6. Return to `/admin/rewards`, select another prize, and choose **Update test prize**.
7. Choose **Turn off test mode** when finished.
