# NestHelper helper application cleaner update

This update refreshes the existing `/helpers` application flow instead of creating a second form.

## What changed

- Updates the public Helpers page language to clearly recruit:
  - deep cleaners / detail cleaners
  - regular recurring home cleaners
  - move-in / move-out cleaners
  - whole-home cleaners
  - laundry and organizing helpers
  - errand helpers
  - local cleaning/partner providers
- Updates the existing individual helper application card to say “cleaner or helper.”
- Adds a required “Primary work you’re applying for” field to the helper application.
- Adds more service options for deep cleaning, recurring home cleaning, move-in/move-out cleaning, whole-home cleaning, kitchen/bathroom deep cleans, and area resets.
- Adds cleaner-focused work-style, comfort-level, and not-willing-to-do options.
- Expands partner service options for cleaning companies and independent contractors.
- Saves the new `roleFocus` field through public form security validation.
- Shows “Primary Fit” in the admin helper applications table and detail snapshot.
- Updates helper application confirmation/reply wording to say cleaner/helper instead of only Parent Reset helper.

## Files replaced

- `app/helpers/page.tsx`
- `app/helper-application/page.tsx`
- `app/admin/helpers/page.tsx`
- `components/forms/ApplicationForms.tsx`
- `components/admin/AdminTable.tsx`
- `lib/publicFormSecurity.ts`
- `lib/sendAdminEmail.ts`
- `lib/sendCustomerConfirmationEmail.ts`

## PowerShell apply commands

Run these from your local NestHelper project folder:

```powershell
cd C:\Users\inwin\nesthelper_nextjs_site

$temp = "$env:TEMP\nesthelper_helper_application_cleaner_update"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue

Expand-Archive "$env:USERPROFILE\Downloads\nesthelper_helper_application_cleaner_update.zip" -DestinationPath $temp -Force
Copy-Item "$temp\nesthelper_helper_application_cleaner_update\*" . -Recurse -Force
Remove-Item $temp -Recurse -Force

npm run build
```

If `next` is not recognized, run this once from the project folder, then run the build again:

```powershell
npm install
npm run build
```

## Notes

- `/helper-application` still redirects to `/helpers`, so existing links keep working.
- The form still submits to the existing helper and partner application APIs.
- No styling system, service card layout, request form, Stripe, or Google Ads conversion files were changed.
