# Move Prep Request Form Simplification

This update simplifies the Move Prep & Home Reset request form so customers do not have to understand separate QR label packages, supply packages, and priced add-on logic before submitting.

Changed file:

- `components/forms/RequestForm.tsx`

What changed:

- Removed Smart Label Setup and Supply Kit as main package choices from the request form.
- Kept simple starting packages only: Move Prep, Focused Room, Kitchen Essentials, Move-In Essentials, or custom quote.
- Combined focus items and add-ons into one plain-language checklist.
- Reworded add-ons so customers can simply say what they may need.
- Kept a simple pricing guide instead of multiple pricing cards.
- Updated move-out cleaning detection so admin still flags it when the customer selects a move-out cleaning quote.

No intentional changes to Stripe, Google Ads, Firebase, admin routes, login/auth, or service card layout.
