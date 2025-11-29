# ============================================
# RESTORE UI - REMOVE AGGRESSIVE CSS
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RESTORE UI - REMOVE AGGRESSIVE CSS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload restored page.tsx
Write-Host "[1/3] Uploading restored page.tsx..." -ForegroundColor Cyan
scp "src/app/page.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Uploaded" -ForegroundColor Green
Write-Host ""

# Step 2: Rebuild and restart
Write-Host "[2/3] Rebuilding and restarting..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build; pm2 restart cryptorafts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build/restart failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build complete and PM2 restarted" -ForegroundColor Green
Write-Host ""

# Step 3: Wait
Write-Host "[3/3] Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15
Write-Host "  ✓ App should be running now" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ UI RESTORED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "  ✓ Removed aggressive display: flex !important" -ForegroundColor White
Write-Host "  ✓ Removed aggressive display: block !important" -ForegroundColor White
Write-Host "  ✓ Removed forced width: 100% on all divs" -ForegroundColor White
Write-Host "  ✓ Removed forced min-height: 100vh on all sections" -ForegroundColor White
Write-Host "  ✓ Kept only visibility and opacity fixes" -ForegroundColor White
Write-Host "  ✓ Restored original layout structure" -ForegroundColor White
Write-Host ""
Write-Host "Test homepage:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "After deployment:" -ForegroundColor Yellow
Write-Host "  1. Hard refresh: Ctrl+Shift+R" -ForegroundColor White
Write-Host "  2. Clear browser cache" -ForegroundColor White
Write-Host "  3. UI should be restored to original layout" -ForegroundColor White
Write-Host ""

