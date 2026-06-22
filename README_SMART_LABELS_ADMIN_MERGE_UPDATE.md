# NestHelper Smart Labels Admin Merge Update

This update keeps the newer Smart Labels system and adds the stronger admin-management pieces from the original version.

## What changed

- `/admin/smart-labels` now has a full management view:
  - Customer/sheet list
  - Selected sheet details
  - Active / filled-out / PIN / photo counts
  - Search labels inside a sheet
  - Open customer label page
  - Copy label URL
  - Reset PIN back to OFF / no PIN
  - Archive labels
  - Restore labels
  - Export selected sheet as CSV
- `/admin/smart-labels/print/[batchId]` now has better sticker-company notes:
  - Waterproof vinyl or polyester
  - UV/weather-resistant laminate
  - Optional removable low-residue adhesive
  - High-contrast black-on-white QR codes
  - Proof-first reminder
- New admin API route:
  - `/api/admin/smart-labels/update-label`
  - Requires admin Firebase token
  - Supports `resetPin`, `archive`, and `restore`

## Important

Customer label pages still keep the newer photo-upload support. The older original version only had photo notes, so this update does not downgrade that part.

## Local apply commands

```powershell
cd C:\Users\inwin\nesthelper_nextjs_site

$temp = "$env:TEMP\nesthelper-smart-labels-admin-merge-update"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue

Expand-Archive "$env:USERPROFILE\Downloads\nesthelper_smart_labels_admin_merge_update_replacements.zip" -DestinationPath $temp -Force
Copy-Item "$temp\*" . -Recurse -Force
Remove-Item $temp -Recurse -Force

npm run typecheck
npm run build

git status
git add README_SMART_LABELS_ADMIN_MERGE_UPDATE.md app/admin/page.tsx app/admin/smart-labels app/api/admin/smart-labels app/api/smart-labels app/labels app/faq/page.tsx app/services/page.tsx components/admin/AdminShell.tsx firebase/firestore.rules lib/smartLabels.ts lib/smartLabelsServer.ts middleware.ts
git commit -m "Improve Smart Labels admin management"
git push

firebase deploy --only firestore:rules
```

If `next` is not recognized, run:

```powershell
npm install
```
