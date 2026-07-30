# Launch Rewards prelaunch test modes

Admin test mode is available from `/admin/rewards` and is bound to the current browser with a signed HttpOnly cookie that expires after two hours.

## Quick wheel preview

Use this when checking wheel animation, landing positions, modal layout, and each forced prize.

- Skips phone and email verification.
- Uses `/api/rewards/test-spin`.
- Creates only `launchRewardTestSpins` and `launchRewardTestSpinRequests` records.
- Creates no redeemable reward and does not affect live odds, participant cooldowns, or the monthly Parent Reset limit.

## Full verification test

Use this before launch to exercise the customer verification flow.

1. Enable **Full verification test — real SMS + email codes** in Admin Rewards.
2. Open the test wheel in the same browser.
3. Enter a phone number and email address you can access.
4. Complete the real Firebase SMS verification.
5. Complete the real NestHelper email-code verification.
6. Run the forced test spin.

Safety boundaries:

- A signed admin test cookie is required.
- Firebase App Check is verified by the email-code and spin endpoints.
- Email verification records are stored separately in `launchRewardTestEmailVerifications`.
- No `launchRewardParticipants`, `launchRewardIdentityLocks`, `launchRewards`, or live monthly spin records are created.
- Marketing opt-in is disabled for a full test.
- The forced prize is marked test-only, has no public redemption token, and cannot be redeemed.
- A Firebase Authentication phone user may be created or reused as part of the real SMS test, but it is not made into a live Launch Rewards participant.

Use **Start fresh test session** to clear the full-test verification state and test the verification steps again. Use **Turn off test mode** when finished.
