Write-Host "Deploying Firestore rules and indexes..." -ForegroundColor Green
firebase deploy --only firestore:rules,firestore:indexes
