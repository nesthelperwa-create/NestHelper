# Laundry Tax Failsafe Update

Files included:
- app/api/admin/create-laundry-final-balance/route.ts
- components/admin/AdminTable.tsx

What changed:
- Added manual WA sales tax controls to the Laundry Rescue checkout/final-balance admin flow.
- The admin can turn on manual sales tax and enter the local tax rate before sending:
  - the intro-minimum checkout link
  - the saved family breakdown laundry deposit checkout
  - the final laundry invoice / auto-charge invoice
- Added a final-invoice failsafe:
  - If the $59 intro minimum already collected tax, the final invoice taxes only additional weight/add-ons.
  - If the $59 intro minimum did not collect tax and manual tax is turned on for the final invoice, the final invoice adds a one-time tax catch-up line for the missed tax on the $59 minimum.
  - The $59 minimum itself is not charged again.
- Added dashboard copy and estimate text so admin can see whether the intro minimum tax appears already collected and what the catch-up amount would be.
- Added Firestore/Stripe metadata for the catch-up calculation so it is easier to audit later.

Important:
- Verify the correct local WA sales tax rate before sending. Stripe automatic tax remains disabled.
- The tax catch-up line is a tax-only adjustment line, not another laundry service charge.
- This patch does not change Stripe automatic tax, Firebase rules, public pages, request forms, or dependencies.
