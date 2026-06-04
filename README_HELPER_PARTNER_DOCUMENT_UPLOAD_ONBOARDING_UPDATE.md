# NestHelper Helper/Partner Document Upload + Onboarding Update

Generated: 2026-06-04

## What changed

### Helper + partner application uploads
- Added an optional "Optional documents" section to both application flows.
- Applicants can upload up to 5 labeled files.
- Accepted file types: PDF, Word, JPG, PNG, WEBP, HEIC/HEIF.
- Max size: 5 MB per file.
- Upload labels are tailored for individual helpers and partner businesses.
- Public wording warns applicants not to upload SSNs, full tax IDs, or sensitive identity/background-check documents through the public form.

### Private storage
- Uploaded files are stored in Firebase Storage under:
  - `application-documents/helperApplications/{docId}/...`
  - `application-documents/partnerApplications/{docId}/...`
- Firestore stores only file metadata, label, size, content type, and storage path.
- Admin dashboard opens files through short-lived signed URLs from a protected admin API route.

### Admin dashboard
- Helper and partner admin detail views now include:
  - Uploaded application documents panel
  - Admin-only onboarding checklist
  - Application status dropdown
  - Reliability / fit rating
  - Best-fit services
  - Strengths
  - Concerns / follow-up needed
  - Do-not-assign notes
  - Internal notes
  - Customer-facing approved bio draft
- Helper/partner list tables now show a Docs count column.

### Server validation fixes
- Fixed the helper/partner server allowlist so new checkbox/dropdown fields actually save.
- Fixed partner application validation so checkbox-based `serviceType` submissions are accepted.

## New API routes

- `POST /api/admin/application-document-url`
  - Admin-only route that returns a 15-minute signed URL for an attached application document.

- `POST /api/admin/update-application-onboarding`
  - Admin-only route that saves helper/partner onboarding checklist and internal notes.

## Environment note

The upload feature uses Firebase Storage through Firebase Admin. Make sure one of these is available in Vercel:

- `FIREBASE_STORAGE_BUCKET`, or
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

If neither is set, the code falls back to `{FIREBASE_PROJECT_ID}.appspot.com`, but the explicit bucket value is safer.

## Validation

- `npm run typecheck` passed.
- `npm run build` compiled successfully, then timed out during Next.js post-compile verification in this container. The existing non-blocking middleware/proxy warning remains.
