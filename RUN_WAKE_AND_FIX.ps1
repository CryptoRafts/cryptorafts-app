# ============================================
# WAKE VPS AND FIX ALL ISSUES
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "WAKING VPS AND FIXING ALL ISSUES" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload wake script
Write-Host "[1/2] Uploading wake and fix script..." -ForegroundColor Cyan
if (Test-Path "WAKE_AND_FIX_VPS.sh") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "WAKE_AND_FIX_VPS.sh" "${vpsUser}@${vpsIp}:/root/WAKE_AND_FIX_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Wake script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] WAKE_AND_FIX_VPS.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Run wake script
Write-Host "[2/2] Running wake and fix script on VPS..." -ForegroundColor Cyan
Write-Host "  This will wake the server and fix all issues..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "chmod +x /root/WAKE_AND_FIX_VPS.sh && /root/WAKE_AND_FIX_VPS.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[OK] VPS WOKEN AND ALL ISSUES FIXED!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your site should now be working at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [FAIL] Wake and fix failed" -ForegroundColor Red
    exit 1
}

