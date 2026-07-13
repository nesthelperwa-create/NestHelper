# Admin Modal Service Badge Update

Files included:
- components/admin/AdminTable.tsx

What changed:
- Adds a small service badge at the top of the opened admin request modal.
- The badge uses the same SERVICE_LOOKS color system as the dashboard list service pills and quick service filter.
- Adds the same service badge inside the Snapshot header after it is opened.
- Keeps the existing service text under the customer/request name.

What did NOT change:
- No Stripe logic.
- No smart checkout logic.
- No tax rules.
- No pricing math.
- No delete/archive behavior.
- No request form logic.
