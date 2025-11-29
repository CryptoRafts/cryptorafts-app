# ============================================
# QUICK DEPLOY UI FIX - SINGLE COMMAND
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "QUICK DEPLOY UI FIX" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload page.tsx
Write-Host "[1/3] Uploading page.tsx..." -ForegroundColor Cyan
scp "src/app/page.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Uploaded" -ForegroundColor Green
Write-Host ""

# Step 2: Rebuild and restart on VPS
Write-Host "[2/3] Rebuilding and restarting on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build; pm2 restart cryptorafts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build/restart failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build complete and PM2 restarted" -ForegroundColor Green
Write-Host ""

# Step 3: Wait and test
Write-Host "[3/3] Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15
Write-Host "  ✓ App should be running now" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test homepage:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "After deployment:" -ForegroundColor Yellow
Write-Host "  1. Hard refresh: Ctrl+Shift+R" -ForegroundColor White
Write-Host "  2. Clear browser cache" -ForegroundColor White
Write-Host "  3. Try incognito window" -ForegroundColor White
Write-Host ""

