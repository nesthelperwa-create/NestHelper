Write-Host "NestHelper Next.js setup" -ForegroundColor Green
if (!(Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "Created .env.local from .env.example. Fill this in before production." -ForegroundColor Yellow
}
npm install
npm run dev
