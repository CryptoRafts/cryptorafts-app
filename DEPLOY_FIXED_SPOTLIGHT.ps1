# ============================================
# DEPLOY FIXED SPOTLIGHT COMPONENT
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIXED SPOTLIGHT COMPONENT" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed SpotlightDisplay
Write-Host "[1/4] Uploading fixed SpotlightDisplay..." -ForegroundColor Cyan
scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "src/components/SpotlightDisplay.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] SpotlightDisplay uploaded" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Rebuild on VPS
Write-Host "[2/4] Rebuilding application on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build complete" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Restart PM2
Write-Host "[3/4] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath} && pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] PM2 restarted" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] PM2 restart failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Wait and check
Write-Host "[4/4] Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] FIXED SPOTLIGHT DEPLOYED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your site should now be working at:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""

