# ============================================
# RUN COMPREHENSIVE VPS DIAGNOSTICS
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RUNNING COMPREHENSIVE VPS DIAGNOSTICS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload diagnostic script
Write-Host "[1/2] Uploading diagnostic script..." -ForegroundColor Cyan
if (Test-Path "DIAGNOSE_VPS.sh") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "DIAGNOSE_VPS.sh" "${vpsUser}@${vpsIp}:/root/DIAGNOSE_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Diagnostic script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] DIAGNOSE_VPS.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Run diagnostic script
Write-Host "[2/2] Running diagnostics on VPS..." -ForegroundColor Cyan
Write-Host "  This will check everything..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "chmod +x /root/DIAGNOSE_VPS.sh && /root/DIAGNOSE_VPS.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[OK] DIAGNOSTICS COMPLETE!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Review the output above to identify the problem." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [FAIL] Diagnostics failed" -ForegroundColor Red
    exit 1
}

