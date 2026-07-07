# Patch 6 Laundry Tax ZIP Autofill + WA DOR Lookup

Files included:
- components/admin/AdminTable.tsx

What changed:
- Adds a “Tax lookup ZIP” field to the Laundry Rescue manual WA sales tax area.
- Auto-fills the ZIP from the selected request using serviceZip, zip, or zipCode.
- Keeps the ZIP editable in case the request ZIP needs correction before lookup.
- Shows the request address beside the manual tax controls.
- Adds an “Open WA DOR lookup” button that opens the WA DOR address-rate lookup in a new tab using the request address/city/ZIP when available.
- Adds a “Copy lookup address” button for manually pasting the address into the WA DOR lookup tool if needed.
- Sends manualSalesTaxLookupZip in tax-related admin requests as future-proof metadata.

Important:
- This does not fully auto-calculate or auto-fill the tax rate.
- Leo/Gen still reviews the DOR result and enters the rate manually.
- The existing failsafe remains: tax catch-up on the $59 minimum only happens if the intro minimum was not already taxed.

No Stripe automatic tax, Firebase rules, public pages, request forms, backend tax math, or dependencies were changed.
