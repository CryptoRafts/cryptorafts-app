# ============================================
# RUN FIX ALL ISSUES ON VPS
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RUNNING FIX ALL ISSUES ON VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fix script
Write-Host "[1/2] Uploading fix script..." -ForegroundColor Cyan
if (Test-Path "FIX_ALL_ISSUES_VPS.sh") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "FIX_ALL_ISSUES_VPS.sh" "${vpsUser}@${vpsIp}:/root/FIX_ALL_ISSUES_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Fix script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] FIX_ALL_ISSUES_VPS.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Run fix script
Write-Host "[2/2] Running fix script on VPS..." -ForegroundColor Cyan
Write-Host "  This will fix all issues..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_ALL_ISSUES_VPS.sh && /root/FIX_ALL_ISSUES_VPS.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[OK] ALL ISSUES FIXED!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your site should now be working at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [FAIL] Fix failed" -ForegroundColor Red
    exit 1
}

