# ============================================
# FIX HYDRATION ERROR
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FIXING HYDRATION ERROR" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Upload fixed page component
Write-Host "[1/3] Uploading fixed page component..." -ForegroundColor Cyan
scp src/app/page.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ page.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload page.tsx" -ForegroundColor Red
    exit 1
}

# Rebuild app
Write-Host ""
Write-Host "[2/3] Rebuilding app..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build complete" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Restart PM2
Write-Host ""
Write-Host "[3/3] Restarting app..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App restarted" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to restart app" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ HYDRATION FIX DEPLOYED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The hydration error should now be fixed." -ForegroundColor White
Write-Host "Refresh your browser to see the changes." -ForegroundColor White
Write-Host ""
