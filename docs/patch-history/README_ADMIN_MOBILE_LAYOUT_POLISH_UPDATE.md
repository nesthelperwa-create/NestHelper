# Admin Mobile Layout Polish Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/FamilyPaymentBreakdownBuilder.tsx

What changed:
- Mobile admin request snapshot cards now stay inside the modal border.
- Advanced/full saved answer cards now stay inside the modal border and wrap long text.
- Admin modal containers now prevent horizontal overflow.
- Draft Estimate Builder modal is more mobile-friendly:
  - smaller top offset/padding on phones
  - compact sticky header
  - long explanation hidden on phones and replaced with a short note
  - Save draft / Close buttons use less vertical space
  - builder content uses one-column mobile layout with overflow protection

What did NOT change:
- No Stripe logic.
- No smart checkout token logic.
- No double-payment guard logic.
- No tax rules.
- No pricing math.
- No delete/archive logic.
- No public request form logic.
