Write-Host "Building NestHelper site..." -ForegroundColor Green
npm run build
Write-Host "If build passes, deploy with: npx vercel --prod" -ForegroundColor Cyan
