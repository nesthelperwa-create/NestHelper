# Admin Shortcut Map TOC Order Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx

What changed:
- The Shortcut Map is now positioned at the top of the admin detail popup, above Snapshot.
- Shortcut Map wording now reads like a table of contents.
- The visible admin sections are reordered to match the Shortcut Map flow:
  1. Shortcut Map / Table of Contents
  2. Snapshot
  3. Application quick read/email/onboarding when viewing applications
  4. Commercial Quote or Draft Estimate Builder
  5. Internal Notes
  6. Repeat Laundry or Follow-up / Recurring
  7. Payment / Smart Checkout
  8. Laundry Final Balance when applicable
  9. Additional Payment
  10. Status
  11. Referrals
  12. Review Request
  13. Photos, Docs + Full Answers
- Added an “Add'l pay” shortcut so the additional payment section is represented in the map.
- Shortcut behavior is unchanged: tapping a shortcut opens the collapsed section and jumps to it.

What did NOT change:
- No Stripe logic.
- No smart checkout token logic.
- No double-payment guard logic.
- No tax rules.
- No pricing math.
- No delete/archive behavior.
- No public request form logic.
