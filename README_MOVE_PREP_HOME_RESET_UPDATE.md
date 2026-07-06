# NestHelper Move Prep & Home Reset Update

This replacement-file patch adds the new **Move Prep & Home Reset** service in the safest/simple form.

## What changed

- Added a new public service card for **Move Prep & Home Reset**.
- Added the service as a selectable option on the Parent/household request form.
- Added Move Prep-specific request fields:
  - package / starting point
  - move prep options
  - notes, rooms, timing, and safety notes
  - acknowledgement that NestHelper is not a moving company
- Added related options:
  - Move prep
  - Sorting support
  - Open-first essentials boxes
  - Smart labels
  - Boxes/supplies
  - Donation sorting
  - Move-out cleaning — quote separately
  - Move-in reset
  - Laundry help
  - Unpacking support
- Updated admin request display/quote prompt logic so Leo/Gen can see and quote the selected options.
- Updated customer confirmation summary with move prep package/options/notes.
- Updated service copy, request copy, FAQ, policy text, and site metadata.

## Important positioning

Copy uses the angle:

> Movers handle the heavy lifting. NestHelper helps with the home reset.

The site also includes the boundary language:

> NestHelper does not transport household goods or operate as a moving company. We provide in-home move prep, organizing, labeling, cleaning, unpacking, and reset support.

## Pricing added

- Move Prep Add-On — starting at $199, up to 2 helper-hours
- Focused Room Prep — $249, up to 2.5 helper-hours
- Kitchen Essentials Prep — $349, up to 3.5 helper-hours
- Move-In Essentials Reset — $299, up to 3 helper-hours
- Smart Label Setup — $99, up to 20 QR labels
- Supply Kits — $59–$199
- Garage, storage areas, sheds, and heavy clutter — custom quote after review
- Additional approved time — $65 per helper-hour, 1-hour minimum
- Move-out cleaning remains quoted separately

## Notes

This patch does not intentionally change Stripe, Google Ads tracking, Firebase rules, authentication, or existing service card alignment behavior.

I could not run a local Next.js build in the sandbox because the uploaded project zip does not include `node_modules`. Vercel should install dependencies and build after push.
