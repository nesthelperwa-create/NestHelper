# Family Builder Modal Top Spacing Fix

Files included:
- components/admin/FamilyPaymentBreakdownBuilder.tsx

What changed:
- Fixed the Family Payment Breakdown Builder popup so the top header/buttons are not hidden under the site navigation bar.
- Moved the modal overlay down below the sticky site header.
- Increased the modal overlay z-index so the popup stays above the admin page content.
- Kept the builder header sticky inside the popup, so Save draft and Close remain easier to reach while scrolling.
- Added bottom spacing so the bottom actions are not cramped against the browser edge.

No pricing, presets, Stripe, Firebase, request form, public pages, backend APIs, or dependencies were changed.
