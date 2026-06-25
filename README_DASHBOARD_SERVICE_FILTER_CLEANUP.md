# NestHelper Dashboard Service Filter Cleanup

This small patch updates the admin Service Requests dashboard so it only shows the current service categories in the quick service filter.

## Updated dashboard quick filters

- Parent Reset Plan
- Whole Home Cleaning
- Specific Area(s) Reset
- Move-In / Move-Out Cleaning
- Errand Helper
- Laundry Rescue
- Commercial Reset

## Removed from the public dashboard filters

- old 2-hour Parent Reset filter
- old Helper Block / 4-hour filter
- old Family Reset wording
- old A La Carte wording

Old records are still preserved. They are normalized into the current service labels so historic 2-hour, 3-hour, 4-hour, family reset, helper block, and a la carte requests can still be found under the closest current service category.

## Files changed

- components/admin/AdminTable.tsx

No package/dependency changes were made.
