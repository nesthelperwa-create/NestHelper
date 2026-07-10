# Referral Share Email Credit Wording Update

Files included:
- lib/sendReferralShareEmail.ts

What changed:
- The referral share email now clearly tells the happy customer what the referred family can receive:
  - Laundry Rescue: $10 off their first Laundry Rescue order.
  - Other eligible NestHelper family services: referral credit may be $25.
  - Commercial Reset is not included.
- The plain-text version of the email was updated too, so it still reads correctly in email clients that block HTML.

What did NOT change:
- No referral math.
- No Stripe logic.
- No admin flow.
- No Firebase rules.
- No public request form.
- No referral link creation logic.
- No pricing or tax logic.

This is email wording only.
