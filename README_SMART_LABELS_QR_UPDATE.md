# NestHelper Smart Labels QR update

This update adds customer-owned QR organizing labels for bins, closets, garages, moving boxes, seasonal storage, and NestHelper resets.

## What changed

- Added Admin Dashboard section: `/admin/smart-labels`
- Added QR label sheet printer: `/admin/smart-labels/print/[batchId]`
- Added public scan/update page: `/labels/[code]`
- Added admin API to generate unique label sheets
- Added public API to load, unlock, and update individual labels
- Added optional 4-digit PIN support; default is OFF / no PIN
- Added compressed photo support on each label page
- Added Firestore collections:
  - `smartLabelBatches`
  - `smartLabels`
- Added Smart Labels copy to Services and FAQ pages
- Updated Firestore rules for admin access to the new collections

## How the flow works

1. Admin opens `/admin/smart-labels`.
2. Admin generates a sheet of 30, 36, or 45 unique QR labels.
3. Admin opens the print sheet and prints/saves as PDF for the sticker company.
4. Each QR code points to a unique `/labels/[code]` page on NestHelperWA.com.
5. Customer scans the sticker and updates:
   - Label name
   - Location
   - Items inside
   - Notes
   - Small photos
   - Optional 4-digit PIN
6. Labels start as customer-owned with no PIN. The family can add a PIN later.

## Important production note

The print sheet uses a QR image service URL at print time to render QR codes without adding a new npm package. Before sending a full order to the sticker company, print or save one sample sheet and scan several QR codes.

## Deploy checklist

Run the normal website deploy, then deploy Firestore rules:

```powershell
cd C:\Users\inwin\nesthelper_nextjs_site
npm run build
git status
git add app/api app/admin app/labels app/services/page.tsx app/faq/page.tsx components/admin/AdminShell.tsx firebase/firestore.rules middleware.ts lib/smartLabels.ts lib/smartLabelsServer.ts README_SMART_LABELS_QR_UPDATE.md
git commit -m "Add NestHelper Smart Labels QR system"
git push
firebase deploy --only firestore:rules
```

If `firebase` is not recognized, use your existing Firebase deploy script:

```powershell
.\scripts\firebase-deploy-rules.ps1
```

## Optional environment variable

You can add this later for a private PIN hashing pepper. If omitted, the project ID is used with the label code.

```text
SMART_LABEL_PIN_PEPPER=use-a-long-random-secret
```
