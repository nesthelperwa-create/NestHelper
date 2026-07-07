# Laundry Tax DOR Autofill Rate Update

Files included:
- components/admin/AdminTable.tsx
- app/api/admin/lookup-wa-tax-rate/route.ts

What changed:
- Fixes the Laundry tax section layout so the DOR lookup buttons no longer cover or crowd the tax wording.
- Adds a new “Lookup + fill rate” button.
- The button asks a secure admin API route to query the WA DOR address-rate lookup using the request address/city/ZIP.
- If WA DOR returns a usable rate like Rate=.105, the admin automatically fills Sales tax rate % as 10.5.
- Keeps “Open DOR page” and “Copy address” as backup options.
- Keeps Leo/Gen in control: the rate is filled into the field for review before sending, not charged automatically without review.

Important:
- Stripe automatic tax remains off.
- The existing tax failsafe remains unchanged.
- If DOR cannot match the address cleanly, the admin shows an error and you can still use the manual DOR page/copy address buttons.

No public pages, request forms, pricing, Firebase rules, or dependencies were changed.
