# Firebase / Firestore Setup

## Collections used

- `serviceRequests`
- `helperApplications`
- `partnerApplications`
- `contactMessages`

## Steps

1. Create a Firebase project.
2. Create a Firestore database.
3. Add a Web App in Firebase settings.
4. Copy Firebase config into `.env.local`.
5. Install Firebase CLI:

```powershell
npm install -g firebase-tools
firebase login
firebase init firestore
```

6. Replace generated rules/indexes with the included files under `/firebase`.
7. Deploy rules:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

## Security note

The public website forms intentionally do not collect SSNs, ID photos, bank info, or sensitive onboarding documents. Handle background checks, identity documents, and payroll onboarding through secure providers.
