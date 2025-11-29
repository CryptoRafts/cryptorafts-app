# ============================================
# RUN BUILD FIX ON VPS
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIXING BUILD ISSUES ON VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fix script
Write-Host "[1/2] Uploading build fix script..." -ForegroundColor Cyan
if (Test-Path "FIX_BUILD_ISSUES.sh") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "FIX_BUILD_ISSUES.sh" "${vpsUser}@${vpsIp}:/root/FIX_BUILD_ISSUES.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Fix script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] FIX_BUILD_ISSUES.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Run fix script
Write-Host "[2/2] Running build fix on VPS..." -ForegroundColor Cyan
Write-Host "  This will clean, rebuild, and restart the app..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_BUILD_ISSUES.sh && /root/FIX_BUILD_ISSUES.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[OK] BUILD FIX COMPLETE!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your app should now work properly at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [FAIL] Build fix failed" -ForegroundColor Red
    exit 1
}

