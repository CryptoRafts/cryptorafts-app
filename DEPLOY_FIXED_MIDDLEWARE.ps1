# ============================================
# DEPLOY FIXED MIDDLEWARE TO VPS
# Uploads fixed middleware.ts to fix redirect loop
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIXED MIDDLEWARE" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed middleware
Write-Host "[1/3] Uploading fixed middleware.ts..." -ForegroundColor Cyan
if (Test-Path "src/middleware.ts") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "src/middleware.ts" "${vpsUser}@${vpsIp}:${vpsPath}/src/middleware.ts"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] middleware.ts uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] middleware.ts not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Build application
Write-Host "[2/3] Building application..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Build complete" -ForegroundColor Green
Write-Host ""

# Step 3: Restart PM2
Write-Host "[3/3] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Restart failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] PM2 restarted" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] MIDDLEWARE FIXED AND DEPLOYED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "  [OK] Removed redirect from middleware (nginx handles it)" -ForegroundColor White
Write-Host "  [OK] Fixed redirect loop issue" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "Also run nginx fix on VPS:" -ForegroundColor Yellow
Write-Host "  Run: sudo ./FIX_REDIRECT_LOOP_VPS.sh" -ForegroundColor White
Write-Host "  Or manually fix nginx (see FIX_REDIRECT_LOOP.md)" -ForegroundColor White
Write-Host ""

