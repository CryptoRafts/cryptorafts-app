# ============================================
# DEPLOY BUILD SCRIPT TO VPS
# Uploads build script and runs it
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPassword = "Shamsi2627@@"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING BUILD SCRIPT TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload build script
Write-Host "[1/2] Uploading build script..." -ForegroundColor Cyan
if (Test-Path "BUILD_ON_VPS.sh") {
    scp -o ConnectTimeout=10 -o ServerAliveInterval=5 BUILD_ON_VPS.sh "${vpsUser}@${vpsIp}:/root/BUILD_ON_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Build script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] BUILD_ON_VPS.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Run build script
Write-Host "[2/2] Running build on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 5-7 minutes..." -ForegroundColor Yellow
Write-Host "  Password: $vpsPassword" -ForegroundColor Gray
ssh -o ConnectTimeout=10 -o ServerAliveInterval=5 "${vpsUser}@${vpsIp}" "chmod +x /root/BUILD_ON_VPS.sh && /root/BUILD_ON_VPS.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[OK] BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your site should now be working at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    Write-Host "  Run manually on VPS:" -ForegroundColor Yellow
    Write-Host "    cd /var/www/cryptorafts" -ForegroundColor White
    Write-Host "    npm install --legacy-peer-deps" -ForegroundColor White
    Write-Host "    npm run build" -ForegroundColor White
    Write-Host "    pm2 restart cryptorafts" -ForegroundColor White
    exit 1
}

