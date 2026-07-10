# Phone Autofill Country Code Fix

Files included:
- lib/formatPhoneNumber.ts

What changed:
- Fixed phone autofill when a browser/contact manager enters a U.S. phone number with a leading country code.
- Example: 1-425-790-1330 now becomes 425-790-1330 instead of dropping the last digit.
- Normal 10-digit entries still format the same way.
- This affects request/contact forms that use the shared formatPhoneNumber helper.

No request flow, Stripe, Firebase, admin pricing, backend APIs, or dependencies were changed.
