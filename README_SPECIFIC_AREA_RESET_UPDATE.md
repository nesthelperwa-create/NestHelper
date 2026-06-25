# NestHelper Specific Room / Add-On Reset Update

This replaces the awkward single “primary area” dropdown with a clearer Specific Area Reset flow. Customers now choose the room(s) first, then choose the cleaning/reset type and optional detail add-ons.

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
