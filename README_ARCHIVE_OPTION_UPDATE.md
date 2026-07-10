# Archive Option Update

Files included:
- components/admin/AdminTable.tsx
- app/api/admin/create-repeat-laundry-request/route.ts
- app/api/admin/create-recurring-service-request/route.ts

What changed:
- Adds a quick admin-only “Archive / hide from active” button in the Status section for service requests.
- Archiving sets the request status to “Archived.”
- The customer is NOT emailed when using the archive button.
- Archived requests move out of the active work queue and stay saved in admin.
- Service request dashboard now defaults to the Active work queue instead of All records.
- Closed/archived leads are still available under Closed or All.
- Adds helpful close statuses to the service request status dropdown:
  - Archived
  - Closed - No Response
  - Closed - Canceled
  - Closed - Not a Fit
  - Closed - Duplicate
- Treats Closed-* and No Response statuses as closed queue items.

What did NOT change:
- No Stripe logic.
- No tax math.
- No referral amounts.
- No payment logic.
- No customer form logic.
- No customer emails.
- No request creation logic.
- No recurring/follow-up behavior.
- No deletion logic.

Recommended use:
- Use Archive for real leads you want out of the active queue but still saved.
- Use Closed - No Response / Closed - Canceled / Closed - Not a Fit when you want more detail.
- Use delete only for test/spam/junk if a delete option is available elsewhere.
