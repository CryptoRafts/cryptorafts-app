# ============================================
# DEPLOY WAKE AND FIX SCRIPT
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING WAKE AND FIX SCRIPT" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed SpotlightDisplay
Write-Host "[1/3] Uploading fixed SpotlightDisplay..." -ForegroundColor Cyan
if (Test-Path "src/components/SpotlightDisplay.tsx") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "src/components/SpotlightDisplay.tsx" "${vpsUser}@${vpsIp}:/var/www/cryptorafts/src/components/SpotlightDisplay.tsx"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] SpotlightDisplay uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] SpotlightDisplay.tsx not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Upload wake script
Write-Host "[2/3] Uploading wake script..." -ForegroundColor Cyan
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

# Step 3: Run wake script
Write-Host "[3/3] Running wake and fix script..." -ForegroundColor Cyan
Write-Host "  This will wake the VPS and fix all issues..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "chmod +x /root/WAKE_AND_FIX_VPS.sh && /root/WAKE_AND_FIX_VPS.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[OK] VPS WOKEN AND FIXED!" -ForegroundColor Green
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

