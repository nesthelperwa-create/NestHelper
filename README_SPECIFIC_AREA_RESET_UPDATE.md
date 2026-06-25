# NestHelper Specific Room / Add-On Reset Update

This replaces the awkward single “primary area” dropdown with a clearer Specific Area(s) Reset flow. Customers now choose the room(s) first, then choose the cleaning/reset type and optional detail add-ons.

## What changed

- Replaced the single primary-area dropdown with room/area checkboxes.
- Customers can select multiple rooms at once: Kitchen, Bathroom(s), Garage, Pantry, Closet, Playroom, Laundry room, Entry/Mudroom, Bedrooms, Living room, Moving prep area, or Other.
- Kept the form simple by using one shared add-on/focus list instead of separate mini-forms by room.
- Added detail items like interior fridge, interior oven, inside cabinets/drawers, pantry shelves, dishes/sink reset, appliance exteriors, shower/tub buildup, grout/soap scum, floors, baseboards, donation prep, and Smart Labels.
- Bathroom count appears only when Bathroom(s) is selected.
- Admin and customer confirmation email now show rooms/areas and cleaning add-ons more clearly.
- Public form security accepts and validates the new fields.

## Files included

- `components/forms/RequestForm.tsx`
- `components/admin/AdminTable.tsx`
- `lib/publicFormSecurity.ts`
- `lib/sendCustomerConfirmationEmail.ts`
- `lib/services.ts`
- `app/services/page.tsx`
- `app/faq/page.tsx`
- `app/request/page.tsx`


## Scheduling wording fix

- Renamed **How soon do you need help?** to **Scheduling preference** so it no longer conflicts with a requested date that may be weeks or months out.
- Renamed **Preferred date** to **Requested date** in the form, admin details, export, and customer confirmation email.
- Updated scheduling options to support ASAP, flexible around the requested date, date-important, planning ahead, and recurring requests.
## Latest small wording fixes

- Renamed the service/category display to **Specific Area(s) Reset** because customers can choose more than one room or area.
- Added a short Smart Labels explanation on the request form: they are simple QR stickers for bins, shelves, closets, boxes, and storage areas so families can scan and update what belongs there.

## Smart Label dropdown cleanup

- Replaced the confusing Smart Label package-price dropdown with two simpler customer questions:
  - Would you like Smart Label help?
  - Estimated label count / storage spots
- Removed the customer-facing `$2 per extra label` option from the dropdown so customers do not confuse extra labels with setup labor.
- Added `smartLabelEstimatedCount` to the request payload, admin details, export/print flow, form security allowlist, and customer confirmation email summary.
- Updated Smart Label public wording so setup is quoted after review based on label count, storage spots, organizing needs, and documentation/photos needed.

## Conditional room-specific form update

- Specific Area(s) Reset now shows room-specific add-ons only after the customer selects room(s).
- Kitchen requests show kitchen items like interior fridge, interior oven, cabinets/drawers, dishes/sink reset, appliances, and counters/stovetop/backsplash.
- Bathroom requests show bathroom items like shower/tub buildup, toilet/vanity/sink detail, mirrors/glass, grout/soap-scum focus, floors, and baseboards.
- Garage, pantry, closet, playroom, laundry room, bedrooms, entry/mudroom, and moving-prep areas show organizing, sorting, storage, trash/donation prep, shelves/bins, and Smart Label related options where they make sense.
- Cleaning/reset type options now adjust based on the selected room(s), so customers are not shown one broad list when only a kitchen or bathroom is selected.
- Smart Label setup details are also conditional: the label count only appears when the customer chooses setup help, and notes only appear when starter labels or setup help are selected.
