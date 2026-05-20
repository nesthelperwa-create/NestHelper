param(
  [string]$TargetPath = "."
)

Write-Host "Applying NestHelper admin update to: $TargetPath" -ForegroundColor Cyan

$folders = @("app", "components", "lib", "firebase", "docs")
foreach ($folder in $folders) {
  if (Test-Path $folder) {
    Copy-Item -Path $folder -Destination $TargetPath -Recurse -Force
    Write-Host "Copied $folder" -ForegroundColor Green
  }
}

if (Test-Path ".env.admin.example") {
  Copy-Item ".env.admin.example" -Destination (Join-Path $TargetPath ".env.admin.example") -Force
  Write-Host "Copied .env.admin.example" -ForegroundColor Green
}

Write-Host "Done. Next run: npm install firebase firebase-admin resend" -ForegroundColor Yellow
