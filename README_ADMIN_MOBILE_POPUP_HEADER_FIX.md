# Admin Mobile Popup Header Fix

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx

What changed:
- Fixes the admin request popup being covered by the public site header on mobile.
- Raises the popup overlay above the site header.
- Makes the popup align from the top of the phone screen instead of being vertically centered.
- Uses mobile-safe viewport height so the top/Close area stays visible.
- Makes the Close button slightly smaller on narrow screens.

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No Firebase rules.
- No public request form.
- No checkout/invoice creation logic.
- No status email logic.
- No pricing or quote presets.

This is a mobile admin popup layout fix only.
