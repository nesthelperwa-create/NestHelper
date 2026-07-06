# Move Prep & Home Reset Workflow Polish

Small follow-up patch after reviewing the Move Prep request flow.

## What changed

- Sets the Move Prep package default to **Not sure — recommend after review** so customers do not feel forced to choose the wrong package.
- Keeps package pricing visible, but makes the dropdown easier to understand as a starting point.
- Adds **Move prep before movers arrive** as an explicit checkbox.
- Changes **Move-out cleaning quote** to **Move-out cleaning — quote separately** so the admin flag works correctly.
- Makes the add-on/focus checkboxes optional instead of required.
- Keeps the details box and moving-company acknowledgement required.
- Does not change Stripe, Google Ads, Firebase rules, auth, or service-card layout.

## Files included

- components/forms/RequestForm.tsx
