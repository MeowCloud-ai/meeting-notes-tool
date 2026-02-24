# MeowMeet Build Script (PowerShell)
Write-Host "Building MeowMeet..." -ForegroundColor Cyan

# 1. Build
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

# 2. Copy static files
Copy-Item popup.html dist\ -Force
Copy-Item offscreen.html dist\ -Force
if (Test-Path icons) { Copy-Item icons dist\icons -Recurse -Force }

# 3. Generate dist manifest (fix paths for Chrome)
$manifest = Get-Content manifest.json -Raw | ConvertFrom-Json
$manifest.background.service_worker = "background.js"
$manifest.content_scripts[0].js = @("content.js")
$manifest | ConvertTo-Json -Depth 10 | Out-File dist\manifest.json -Encoding utf8NoBOM

Write-Host "Done! Load dist/ folder in chrome://extensions/" -ForegroundColor Green
