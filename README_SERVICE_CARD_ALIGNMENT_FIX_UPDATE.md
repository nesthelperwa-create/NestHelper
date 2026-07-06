# Service Card Alignment Fix Update

Files included:
- components/ServiceCard.tsx

What changed:
- Fixed collapsed service cards to use the same card height on desktop.
- Reserved the same amount of space for service titles, descriptions, and price panels.
- Removed the self-start behavior that let cards sit at different heights.
- Reduced the oversized card title styling from the prior icon-layout update so cards look cleaner in a 3-column grid.
- Kept the updated service icons intact; this patch only fixes the card layout/alignment.

No service text, pricing logic, request form, Stripe, Firebase, admin, backend, or dependency changes were made.
