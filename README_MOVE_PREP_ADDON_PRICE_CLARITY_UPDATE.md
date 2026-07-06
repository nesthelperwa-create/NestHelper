# Move Prep add-on price clarity update

This small patch only updates `components/forms/RequestForm.tsx`.

What changed:
- Separates Move Prep checkboxes into two clearer groups:
  - items usually handled within the selected helper-hours
  - priced add-ons / separate quotes
- Clarifies that QR Smart Labels are +$99 up to 20 labels unless Smart Label Setup is chosen as the main package.
- Clarifies that supply kits are handled in the supply status dropdown at $59–$199.
- Keeps move-out cleaning as a separate quote.
- Keeps the required moving-company disclaimer.
- Sets the Move Prep direct-link default supply status to “Not sure yet” so the dropdown is not confusing.

No Stripe, Google Ads, Firebase auth/rules, service card layout, or admin routes were changed.
