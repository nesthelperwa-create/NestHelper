Admin dashboard queue update

What this update does
- Adds a Work Queue row above the service request table so the admin can quickly jump between Active queue, Needs review, Needs payment, Payment sent, Paid/Scheduled, Completed, Closed, and All records.
- Defaults service requests to Active queue so completed/canceled/declined records do not bury current work.
- Keeps existing filters, service buttons, table, details modal, styling, and payment/referral flows intact.
- The Clear button returns the dashboard to the normal Active queue view.
- No Firebase rules change is needed.

Changed file
- components/admin/AdminTable.tsx
