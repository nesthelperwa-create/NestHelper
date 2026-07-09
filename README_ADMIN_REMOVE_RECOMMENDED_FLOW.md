# Admin Remove Recommended Flow Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx

What changed:
- Removed the “Recommended flow” dropdown/card from the top of the admin details popup.
- Removed the now-unused AdminWorkflowGuide component from AdminTable.tsx.
- Kept the simpler Shortcut map, quote helper, print/download section, snapshot, and all action sections.

What did NOT change:
- No Stripe logic.
- No tax math.
- No Firebase rules.
- No public request form logic.
- No checkout/invoice creation logic.
- No status email logic.
- No webhook/API behavior.
- No pricing or quote presets.

This is a small UI cleanup on top of the admin mobile/simplified cleanup patch.
