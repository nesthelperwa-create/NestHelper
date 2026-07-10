# Whole Home Bedroom Field Fix Update

Files included:
- components/forms/RequestForm.tsx

What changed:
- Replaced the Whole Home Cleaning “Bedrooms” free-text field with a simple dropdown.
- Replaced the Whole Home Cleaning “Bathrooms” free-text field with a simple dropdown.
- Also updated the Move-In / Move-Out Cleaning bedrooms/bathrooms fields to use the same dropdowns for consistency.
- This avoids the form blocking customers who type values like “2” or “two” into the bedroom field.
- Updated the Whole Home validation message to say “Please complete...” instead of implying a specific typing format.

No Stripe, Firebase, admin, pricing, backend, icons, or dependencies were changed.
