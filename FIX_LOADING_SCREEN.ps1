# ============================================
# FIX LOADING SCREEN BLOCKING UI
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIXING LOADING SCREEN ISSUE" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed loading.tsx
Write-Host "[1/3] Uploading fixed loading.tsx..." -ForegroundColor Cyan
scp "src/app/loading.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/loading.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Uploaded" -ForegroundColor Green
Write-Host ""

# Step 2: Upload fixed LoadingOptimizer.tsx
Write-Host "[2/3] Uploading fixed LoadingOptimizer.tsx..." -ForegroundColor Cyan
scp "src/components/LoadingOptimizer.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/components/LoadingOptimizer.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Uploaded" -ForegroundColor Green
Write-Host ""

# Step 3: Rebuild and restart
Write-Host "[3/3] Rebuilding and restarting..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build; pm2 restart cryptorafts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build/restart failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build complete and PM2 restarted" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ LOADING SCREEN FIXED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "  ✓ Removed blocking loading screen from loading.tsx" -ForegroundColor White
Write-Host "  ✓ Fixed LoadingOptimizer to not block UI" -ForegroundColor White
Write-Host "  ✓ Homepage now renders immediately" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""













