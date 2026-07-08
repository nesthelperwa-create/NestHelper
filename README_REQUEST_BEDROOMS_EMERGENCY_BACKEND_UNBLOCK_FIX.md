# Request Bedrooms Emergency Backend Unblock Fix

Files included:
- lib/publicFormSecurity.ts

What changed:
- Adds bedrooms to the public service request allowlist so bedroom values are saved when provided.
- Removes bedrooms as a hard backend blocker for Whole Home Cleaning submissions.
- Keeps square footage, bathrooms, visit type, address, contact info, acknowledgement, and priorities required.
- This prevents customers from being blocked by the backend error: “Please complete: bedrooms.”

Why this is safer:
- The form still asks for bedrooms.
- If the field ever gets stripped by browser autofill, an older cached form, or another frontend issue, the request can still submit.
- Leo/Gen can clarify bedroom count during review instead of losing the lead.

No Stripe, Firebase rules, admin, pricing, public copy, icons, request flow, or dependencies were changed.
