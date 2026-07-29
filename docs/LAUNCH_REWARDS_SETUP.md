# NestHelper Launch Rewards setup

Launch date: **Wednesday, August 5, 2026 at 12:00 a.m. Pacific Time**

The code opens automatically at the launch time. The homepage ticker and `/rewards` countdown are visible before launch.

## Required before deployment

1. Generate a dedicated `REWARDS_SESSION_SECRET` and add the same value to local development and Vercel.
2. In Firebase Authentication, enable **Phone** sign-in.
3. Confirm these Firebase Authentication authorized domains:
   - `nesthelperwa.com`
   - `www.nesthelperwa.com`
   - your active Vercel production domain
4. Create a score-based **reCAPTCHA Enterprise Website key** for the website domains.
5. In Firebase Console > App Check, register the existing web app with that reCAPTCHA Enterprise key.
6. Add the public site key as `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` locally and in Vercel.
7. Deploy `firebase/firestore.rules` before public testing.
8. In Firestore TTL settings, enable TTL on the `expiresAt` field for `launchRewardEmailVerifications` and `launchRewardRateLimits` so temporary security records are cleaned up automatically.
9. Add NestHelper's complete business mailing address to the Sponsor section of `app/rewards/rules/page.tsx` before launch.

Do not enable broad App Check enforcement for existing Firebase products until metrics have been monitored. The Launch Rewards API routes verify App Check tokens directly; the spin endpoint also consumes a limited-use token for replay protection.

## Local environment values

Add these to `.env.local` without committing the file:

```text
REWARDS_SESSION_SECRET=<long random secret>
NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=<reCAPTCHA Enterprise site key>
```

## Promotion controls currently coded

- One spin every 7 days
- Maximum 4 spins per calendar month
- Free Parent Reset odds: 1 in 500 per eligible spin while available
- Maximum 1 verified free Parent Reset winner per calendar month
- A grand-prize winner is not guaranteed each month
- Standard reward expiration: 30 days
- Rare prize claim deadline: 72 hours
- Initial campaign end: December 31, 2026 at 11:59:59 p.m. Pacific Time

## Testing checklist

- Use a Firebase Authentication test phone number for local testing.
- Verify the prelaunch homepage ticker and `/rewards` countdown.
- Verify SMS, then email, using a non-admin test identity.
- Confirm the first spin is saved in Firestore.
- Refresh, clear cookies, and verify again with the same phone/email; the cooldown must remain.
- Open multiple tabs and confirm only one spin is accepted.
- Confirm the reward opens the correct request form.
- Confirm a referral or promo code cannot be combined with a Launch Reward.
- Confirm the admin Rewards page can approve, release, redeem, and void as intended.
- Test a grand prize only with temporary local/test odds; restore `weight: 20` before production.
- Confirm no winner or marketing message is sent automatically. Only user-requested verification messages and the site's existing submitted-request confirmation are sent.
