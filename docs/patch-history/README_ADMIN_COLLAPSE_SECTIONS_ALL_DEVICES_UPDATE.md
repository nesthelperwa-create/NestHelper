# Admin Collapse Sections All Devices Update

Files included:
- components/admin/AdminTable.tsx

What changed:
- Major admin detail sections now start collapsed on desktop, tablet, and mobile.
- Shortcut Map / Table of Contents remains open.
- Clicking a shortcut still opens the matching section before jumping to it.
- Removes the prior desktop auto-open behavior.

What did NOT change:
- No Stripe logic.
- No smart checkout token logic.
- No payment logic.
- No tax rules.
- No pricing math.
- No delete/archive behavior.
- No public request form logic.
