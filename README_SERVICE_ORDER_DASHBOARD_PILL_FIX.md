# Service order + dashboard pill cleanup

Small safe update to keep the Services page chooser in the same order as the service cards and shorten the dashboard service-column pills.

## Changed

- `app/services/page.tsx`
  - Reordered the “Not sure what to choose?” list so it matches the visible card order:
    1. Parent Reset Plan
    2. Whole Home Cleaning
    3. Specific Area(s) Reset
    4. Move-In / Move-Out Cleaning
    5. Errand Helper
    6. Laundry Rescue

- `components/admin/AdminTable.tsx`
  - Shortened service pills in the dashboard table only:
    - Parent Reset Plan → Parent Reset
    - Whole Home Cleaning → Whole Home
    - Specific Area(s) Reset → Area Reset
    - Move-In / Move-Out Cleaning → Move In/Out
    - Errand Helper → Errands
    - Laundry Rescue → Laundry
    - Commercial Reset → Commercial
  - Removed the extra raw legacy service text that was making pills messy.
  - Kept the full service name in the hover title.

No dependency changes.
