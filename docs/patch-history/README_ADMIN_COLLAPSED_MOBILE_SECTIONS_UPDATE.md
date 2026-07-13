# Admin Collapsed Mobile Sections Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx

What changed:
- Major admin request detail sections are now collapsible.
- On mobile, sections start closed to keep the request page short and easier to navigate.
- On desktop/tablet width, sections auto-open so the desktop workflow stays close to the previous view.
- The Shortcut Map stays open.
- Tapping a Shortcut Map item opens that section before jumping to it.
- Collapsed sections include:
  - Snapshot
  - Internal notes
  - Repeat laundry
  - Follow-up / recurring
  - Status + customer update
  - Family referrals
  - Review request
  - Commercial quote
  - Draft estimate builder
  - Payment / smart checkout
  - Laundry final balance
  - Additional payment
  - Photos, docs + full answers
  - Applicant email/onboarding when viewing applications

What did NOT change:
- No Stripe logic.
- No smart checkout token logic.
- No double-payment guard logic.
- No tax rules.
- No pricing math.
- No delete/archive behavior.
- No public request form logic.
