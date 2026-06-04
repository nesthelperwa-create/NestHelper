# NestHelper admin/test cleanup + application form update

This update adds guarded admin cleanup for test records, improves the helper/partner application forms, and fixes one payment-flow inconsistency found during the audit.

## What changed

### Admin dashboard: delete obvious test records
- Added `POST /api/admin/delete-record`.
- The route requires Firebase admin auth and only allows the existing admin collections:
  - `serviceRequests`
  - `helperApplications`
  - `partnerApplications`
  - `contactMessages`
- The admin details modal now shows a **Test cleanup** panel with a confirmation checkbox.
- Service requests are blocked from deletion if they appear to have payment, invoice, checkout, referral, paid, scheduled, or completed history.
- For real customer records, use **Canceled** or **Archived** instead of deleting.

### Commercial Reset request form
- Moved the ZIP field to appear after State so the address order matches the family reset request forms:
  - Service area
  - Street address
  - Suite/unit
  - City/community
  - State
  - ZIP

### Helper and partner application forms
- Reworked both forms so common answers use checkboxes/dropdowns instead of broad text boxes.
- Individual helpers now choose availability, weekly capacity, transportation, travel radius, experience level, services they are comfortable with, and work-style fit.
- Partner businesses now choose service types, business structure, license status, insurance status, capacity, service areas, availability, and documents/proof they can provide later.
- Kept free-form boxes for experience details, references, service-area details, license/insurance notes, and anything else.

### Payment-flow audit fix
- Fixed `create-additional-payment-link` so its `ENABLE_STRIPE_AUTOMATIC_TAX` behavior matches the other Stripe routes.
- Added explicit tax codes for additional payments:
  - Laundry Rescue extras use the laundry tax code.
  - Commercial Reset extras use the commercial cleaning tax code.
  - Family-service extras use the non-taxable/default tax code.

## Validation

- `npm run typecheck` passed.
- `npm run build` compiled successfully and finished TypeScript, but the local container timed out during Next.js page-data collection. The existing Next.js warning about `middleware` being deprecated in favor of `proxy` remains non-blocking.
