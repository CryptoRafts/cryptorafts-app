# ============================================
# FIX AND DEPLOY COMPLETE APP
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FIXING AND DEPLOYING COMPLETE APP" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Upload fixed SpotlightDisplay component
Write-Host "[1/4] Uploading fixed SpotlightDisplay component..." -ForegroundColor Cyan
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SpotlightDisplay.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload SpotlightDisplay.tsx" -ForegroundColor Red
    exit 1
}

# Upload fixed page component
Write-Host ""
Write-Host "[2/4] Uploading fixed page component..." -ForegroundColor Cyan
scp src/app/page.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ page.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload page.tsx" -ForegroundColor Red
    exit 1
}

# Rebuild app
Write-Host ""
Write-Host "[3/4] Rebuilding app..." -ForegroundColor Cyan
Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build complete" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Restart PM2
Write-Host ""
Write-Host "[4/4] Restarting app..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "pm2 restart cryptorafts && sleep 2 && pm2 status"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App restarted" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to restart app" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ COMPLETE FIX DEPLOYED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The app should now be working correctly." -ForegroundColor White
Write-Host "Refresh your browser (Ctrl+Shift+R) to see the changes." -ForegroundColor White
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host "  http://72.61.98.99:3000" -ForegroundColor Cyan
Write-Host ""

