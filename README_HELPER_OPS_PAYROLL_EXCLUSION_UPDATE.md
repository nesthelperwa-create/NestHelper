# NestHelper Helper Ops Payroll Exclusion Update

Updated Helper Ops so canceled, archived, rejected, inactive, deleted, and test records are excluded from:

- Assigned jobs summary count
- Needs review summary count
- Approved payroll summary total
- Payroll summary CSV
- QuickBooks time rows CSV
- Mileage reimbursement CSV

Also added:

- A visible status filter option: `Canceled / test`
- A visible status filter option: `All records`
- A red safety note explaining that canceled/test records are hidden from payroll/export totals
- A badge on excluded records: `excluded from payroll/export`
- A `Clear payroll values` button on each Helper Ops record
- API protection so excluded records cannot be approved for payroll even if an old/canceled/test record is opened

## Files changed

- `components/admin/HelperOpsDashboard.tsx`
- `app/api/admin/update-helper-ops/route.ts`
