# Request Page Runtime Hardening Update

Files included:
- components/forms/RequestForm.tsx
- lib/campaignAttribution.ts
- lib/formInvalidFocus.ts
- app/request/error.tsx

Why this patch exists:
- Sentry reported a RangeError / Maximum call stack size exceeded on the public /request page.
- The event came from an iOS/Chrome browser session with Google Ads click parameters.
- This patch hardens the public form without touching admin, Stripe, invoices, referrals, pricing, or deletes.

What changed:
- Google Ads click params are now safely recognized:
  - gclid
  - gbraid
  - wbraid
  - gad_source
  - gad_campaignid
  - gad_adgroupid
- Campaign attribution is wrapped so browser storage/URL issues can never break the request form.
- The initial form state no longer reads window/location immediately; campaign merge happens in a guarded client effect.
- Invalid-field auto-focus is more defensive on iOS/mobile browsers to avoid focus/validation loops.
- Adds a friendly /request error boundary that tells customers to reload or text NestHelper if the form fails.

What did NOT change:
- No admin dashboard logic.
- No delete button logic.
- No Stripe logic.
- No pricing math.
- No tax logic.
- No referral amounts.
- No customer emails.
- No request submission API logic.
