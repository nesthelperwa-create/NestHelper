# NestHelper Parent Reset Plan + Card Alignment Update

This replacement patch keeps the existing visual design and makes small wording/logic updates based on the latest service-flow decisions.

## Updated

- Reintroduced a customer-facing **Parent Reset Plan** as the 3-hour busy-parent room reset.
- Reworded Parent Reset Plan as organizing selected family spaces + light cleaning + child-safe disinfecting.
- Removed old 2-hour and 4-hour reset cards from the public landing/services/request flow while leaving their internal IDs intact for older records.
- Kept **Whole Home Cleaning** as the full-home cleaning/deep-clean/maintenance option.
- Kept **Specific Area(s) Reset** as selected rooms or focused areas only.
- Kept **Move-In / Move-Out Cleaning** separate for empty or mostly empty homes.
- Updated landing page service cards to use the same cleaner customer-facing service list.
- Updated Services page chooser copy/icons to include Parent Reset Plan.
- Updated request form dropdown and Parent Reset Plan helper text.
- Updated admin/dashboard display labels so `family-reset-3hr` shows as **Parent Reset Plan**.
- Updated quote preset wording for Parent Reset Plan in the family payment builder.
- Changed card grids to stretch items and increased equal-card minimum height to reduce card height mismatches and text clipping.

## Not changed

- No dependency changes.
- No major redesign.
- No header/footer/style overhaul.
- Existing service IDs remain intact for safer compatibility.

## Build note

Run `npm run build` locally after copying these files. If your local machine still says `next is not recognized`, run `npm install` once from the project folder first.
