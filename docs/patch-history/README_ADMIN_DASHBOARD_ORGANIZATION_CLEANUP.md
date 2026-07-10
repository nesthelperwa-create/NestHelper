# Admin Dashboard Organization Cleanup

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx

What changed:
- Added a compact “Work order map” inside the details popup.
- The map gives shortcut cards to the important sections instead of forcing Leo/Gen to scroll through every command:
  - Review snapshot
  - Build quote
  - Send payment
  - Laundry final balance, when relevant
  - Status update
  - Referrals/review request, when relevant
  - Photos/docs/full saved answers
- Changed the popup header from generic “Submission Details” to the customer/applicant/contact name plus service/contact line.
- Added safe section anchors so the shortcuts jump within the popup.
- Added a small admin header helper line and allowed admin nav pills to wrap on wider screens.

What did NOT change:
- No Stripe logic.
- No tax math.
- No Firebase rules.
- No public request form logic.
- No checkout/invoice creation logic.
- No status email logic.
- No webhook/API behavior.
- No pricing or quote presets.

This is intended as a low-risk UI organization patch only.
