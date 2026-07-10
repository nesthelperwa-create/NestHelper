# Admin Prefill + Advanced Answers + Campaign Cleanup Update

Files included:
- components/admin/AdminTable.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts
- lib/campaignAttribution.ts

What changed:

1. Smarter follow-up / recurring prefill
- Pulls richer Whole Home and related request fields into the follow-up section.
- Rooms / scope now prefers roomsAreas, then falls back to square footage, bedrooms, bathrooms, home type, and home areas.
- Focus areas now pulls homePriorities, Whole Home add-ons, Whole Home condition, visit type, area-reset goals, and request details.
- Supplies preference now reads supplyPreference in addition to generic supplies fields.
- Pet notes now combines pets and petDetails when available.
- Cadence now maps Bi-weekly / maintenance-style values to the follow-up cadence dropdown.

2. Advanced / full saved answers cleanup
- Uses cleaner labels instead of raw camelCase where possible.
- Groups advanced fields into:
  - Request answers
  - Tracking / campaign fields
  - System / email fields
- Formats saved timestamp fields more cleanly.
- Keeps the full record available for troubleshooting without making the first view as noisy.

3. Campaign tracking cleanup
- Saved campaign attribution now expires after 24 hours.
- This prevents old Yelp/Google/Facebook tracking from sticking forever in the same browser.
- Added admin/test clearing options for clean tests:
  - /request?clear_campaign=1
  - /request?clearCampaign=1
  - /request?clear_utm=1
  - /request?admin_test=1
  - /request?test_request=1

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment logic.
- No customer form required fields.
- No customer emails.
- No pricing or quote presets.
- No automatic recurring generation.
- No deletion logic.
