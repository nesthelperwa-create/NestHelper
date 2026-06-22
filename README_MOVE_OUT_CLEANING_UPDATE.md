# Specific Area Reset / Garage Reset Update

This replacement package adds a quote-based **Specific Area Reset** service to NestHelper. It keeps Move-In / Move-Out Cleaning intact and adds a residential path for garage cleanup, garage reset, pantry reset, closet reset, playroom reset, laundry room reset, kitchen zone reset, and other focused area requests.

## Key changes

- Adds **Specific Area Reset** to the public services list.
- Adds a request-form path with area type, size, condition, goals, hauling/disposal needs, product preferences, notes, photos, pets, and access notes.
- Adds admin service recognition and custom quote defaults.
- Adds quote builder presets for Garage Reset and Specific Area Reset.
- Keeps Specific Area Reset quote-based so no new Stripe price is required.
- Clarifies exclusions for hazardous materials, pest/biohazard cleanup, mold remediation, unsafe heavy lifting, and heavy hauling unless separately reviewed.

## Stripe

No new Stripe product or environment variable is required for this update. Use the admin custom quote / invoice flow.

## Apply safely

Use a temporary folder outside the repo so the temp folder is not committed.
