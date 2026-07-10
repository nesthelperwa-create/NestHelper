# Admin Dashboard Mobile + Simplified Cleanup

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx

What changed:
- Adds a compact “Shortcut map” inside the admin details popup.
- Uses short labels instead of paragraph-heavy cards:
  - Review
  - Build quote
  - Payment / Deposit
  - Laundry final
  - Status
  - Referrals
  - Review request
  - Photos/docs
- Makes the popup header more useful and shorter:
  - Shows the customer/applicant/contact name.
  - Shows the service/contact line.
  - Changes “Close details” to “Close.”
- Makes the shortcut map more mobile-friendly:
  - Smaller cards.
  - 2-column layout on phones.
  - More columns on larger screens.
  - Hides extra explanatory wording on mobile.
- Adds safe section anchors so shortcut cards jump within the popup.
- Allows admin navigation pills to wrap better on larger screens.

What did NOT change:
- No Stripe logic.
- No tax math.
- No Firebase rules.
- No public request form logic.
- No checkout/invoice creation logic.
- No status email logic.
- No webhook/API behavior.
- No pricing or quote presets.

This is still a low-risk UI organization patch only.
