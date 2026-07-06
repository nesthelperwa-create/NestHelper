# Move Prep unpacking/kitchen add-on clarity update

This update simplifies the Move Prep & Home Reset request form so customers are not forced to choose confusing "Move-In" or "Kitchen" packages from the main starting-point dropdown.

Changed file:
- components/forms/RequestForm.tsx

What changed:
- Main starting-point dropdown now only includes:
  - Move prep before movers arrive — starts at $199
  - Focused room or area prep — $249
  - Custom quote — garage, storage, sheds, or heavy clutter
  - Not sure — recommend after review
- After-move unpacking/reset is now an optional focus item: "After-move unpacking / reset — from $299"
- Kitchen setup/reset is now an optional focus item: "Kitchen setup / kitchen reset — from $349"
- The quick package guide and simple pricing note were updated to explain these as optional focus areas/add-ons instead of confusing main packages.
- The dropdown text size is adjusted for mobile readability.

No Stripe, Google Ads, Firebase, admin route, auth, or dependency changes.
