# Whole Home / Specific Area(s) Request Flow Update

This replacement patch keeps the existing NestHelper styling and page structure, while clarifying the customer flow for Whole Home Reset, Specific Area(s) Reset, and Move-In / Move-Out Cleaning.

## What changed

- Added Whole Home Reset as a separate full-home service option.
- Added a different Whole Home Reset service image/icon so it no longer matches the 3 Hour Reset card.
- Updated Services page helper wording so customers can quickly choose between:
  - Whole Home Reset = entire home
  - Specific Area(s) Reset = selected rooms/areas
  - Move-In / Move-Out Cleaning = empty or mostly empty homes for moving, listing, renting, or turnover
- Added small service-type icon/badge cues to the Services page "Not sure what to choose?" area.
- Updated request form logic for Whole Home Reset visit type:
  - One-time whole home reset
  - First-time deep clean
  - First-time deep clean + recurring maintenance
  - Recurring maintenance only
- Added cadence selection for Whole Home Reset when recurring maintenance applies:
  - Weekly
  - Bi-weekly
  - Monthly
  - Not sure yet
- Updated Specific Area(s) Reset wording so it clearly means selected rooms/focused areas, not the entire home.
- Added Specific Area(s) Reset repeat area support:
  - One-time reset
  - Every 2 weeks
  - Monthly area reset
  - Not sure yet
- Kept room-specific conditional add-ons so customers only see options related to selected rooms/areas.
- Kept Move-In / Move-Out Cleaning separate and preserved the direct request link alias.
- Improved service card wrapping/flex behavior so text, pricing notes, and buttons do not get clipped.
- Updated admin labels, customer confirmation email fields, public form security validation, referrals, and quote builder support for the new flow.

## Direct links preserved

- `/request?service=specific-area-reset#request-form`
- `/request?service=move-in-out-cleaning#request-form`
- `/request?service=whole-home-reset#request-form`
- `/request#request-form`

## Files changed

- `app/faq/page.tsx`
- `app/request/page.tsx`
- `app/services/page.tsx`
- `components/ServiceCard.tsx`
- `components/admin/AdminTable.tsx`
- `components/admin/FamilyPaymentBreakdownBuilder.tsx`
- `components/forms/RequestForm.tsx`
- `lib/policies.ts`
- `lib/publicFormSecurity.ts`
- `lib/referrals.ts`
- `lib/sendCustomerConfirmationEmail.ts`
- `lib/services.ts`
- `public/assets/services/service-whole-home-reset.png`

## Build note

No package dependencies were changed. You should not need to run `npm install` unless your local `node_modules` folder is missing or your terminal says `next is not recognized`.
