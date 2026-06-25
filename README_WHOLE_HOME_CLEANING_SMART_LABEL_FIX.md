# NestHelper Whole Home Cleaning / Smart Label / Services Card Fix

Small safe patch. No dependencies changed.

Updates:
- Uses Whole Home Cleaning as the customer-facing full-home service label while preserving the existing whole-home-reset service id and direct link.
- Keeps Specific Area(s) Reset focused on selected rooms/areas.
- Keeps Move-In / Move-Out Cleaning separate for empty or mostly empty homes.
- Removes the extra Specific Area(s) CTA from the Services page chooser so customers start with the main Request Help button and choose in the form/cards.
- Hides the legacy 2/3/4-hour quick reset package section from the Services page and request dropdown to reduce customer confusion. Existing service ids remain in code for compatibility.
- Adds simple Smart Label setup pricing to the request form: $49 up to 10, $79 up to 20, $109 up to 30.
- Makes form field containers content-start to reduce stretched/misaligned fields.
- Adjusts service card wrapping/price grid to reduce text clipping without redesigning the cards.
