# Patch 4 Admin Family Builder Presets Update

Files included:
- components/admin/FamilyPaymentBreakdownBuilder.tsx

What changed:
- Removed legacy admin line-item presets for:
  - 2-Hour Parent Reset
  - 4-Hour Helper Block
  - old 2-hour Parent Reset recurring presets
  - old Helper Block recurring presets
- Kept current Parent Reset Plan pricing:
  - Parent Reset Plan — $199
  - repeat support every 2 weeks — $189
  - repeat support weekly — $179
- Added current Move Prep & Home Reset admin presets:
  - Move Prep before movers arrive — $199
  - Focused room or area prep — $249
  - After-move unpacking / home reset — from $299
  - After-move kitchen setup / kitchen reset — from $349
  - QR Smart Label setup — $99 up to 20 labels
  - Basic packing supply kit — from $59
  - Larger packing supply kit — reviewed before checkout
  - Move Prep custom review item
- Updated Laundry Rescue presets:
  - Laundry Rescue intro minimum — $59
  - Laundry additional weight — $2.25/lb
  - detergent, low heat, hang dry, rush return add-ons
- Updated default line generation so Move Prep request options can prefill matching admin line items.
- Updated recurring defaults so recurring pricing is based on Parent Reset Plan, not old 2-hour/4-hour services.
- Updated the builder helper text to reflect current NestHelper pricing.

No public pages, request form, Stripe, Firebase rules, backend APIs, or dependencies were changed.
