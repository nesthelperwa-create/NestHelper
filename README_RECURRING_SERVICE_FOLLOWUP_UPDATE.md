# Recurring Service / Follow-Up Request Update

Files included:
- components/admin/AdminTable.tsx
- components/admin/AdminShell.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts

What changed:
- Adds an admin-only “Follow-up / recurring visit” section for non-laundry service requests.
- This is separate from Laundry Rescue, which still uses the Repeat Laundry section.
- The new section appears in the request popup for services like:
  - Whole Home Cleaning
  - Parent Reset
  - Specific Area(s) Reset
  - Move-In / Move-Out Cleaning
  - Move Prep & Home Reset
  - Errand Helper
  - Commercial Reset
- It loads original request details into editable fields where available.
- Leo/Gen can update next-visit details before creating the new request:
  - Next visit date
  - Preferred window
  - Service / plan
  - Cadence
  - Agreed price
  - Estimated helper hours
  - Focus areas
  - Rooms / scope included
  - Supplies preference
  - Pet notes
  - Special instructions
  - Internal note
- Clicking “Create follow-up request” creates a NEW request row in the admin dashboard.
- The old request stays unchanged.
- Customers are NOT emailed automatically.

The new follow-up request resets:
- Status to “Follow-up Scheduled” or “Recurring Scheduled”
- Payment status to “Not Paid”
- Payment links / invoice links
- Completion history
- Status email history

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No Firebase rules.
- No public request form.
- No checkout/invoice creation logic.
- No status email logic.
- No pricing or quote presets.
- No automatic customer emails.

Recommended flow:
1. Customer says they want another cleaning/reset visit or recurring support.
2. Open their completed service request.
3. Jump to “Follow-up.”
4. Review the copied details.
5. Change anything for the next visit.
6. Click “Create follow-up request.”
7. Open the new request row and send the normal quote/payment link when ready.
