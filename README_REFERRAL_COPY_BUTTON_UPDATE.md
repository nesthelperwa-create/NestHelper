Referral copy button update

What this update does
- Adds a real Copy referral link button to the referral share page at /referrals?ref=CODE.
- The copy button copies the full share page URL so customers can paste it into text messages or emails.
- Updates referral share emails to tell customers to open the share page and tap Copy referral link.
- Updates referral reward emails with fresh follow-up referral links to use the same simple instruction.

Why the copy button is on the webpage, not directly inside the email
- Most email apps block JavaScript, so click-to-copy inside the email itself is not reliable.
- The email now sends the customer to the share page, where the copy button works properly.

Changed files
- app/referrals/page.tsx
- components/CopyReferralLinkButton.tsx
- lib/sendReferralShareEmail.ts
- lib/sendReferralRewardEmail.ts
