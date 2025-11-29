# ============================================
# DEPLOY FIXED PACKAGE.JSON AND BUILD
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIXED PACKAGE.JSON" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed package.json
Write-Host "[1/3] Uploading fixed package.json..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "package.json" "${vpsUser}@${vpsIp}:${vpsPath}/package.json"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] package.json uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] package.json not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Upload build script
Write-Host "[2/3] Uploading build script..." -ForegroundColor Cyan
if (Test-Path "FIX_DEPENDENCIES_VPS.sh") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "FIX_DEPENDENCIES_VPS.sh" "${vpsUser}@${vpsIp}:/root/FIX_DEPENDENCIES_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Build script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] FIX_DEPENDENCIES_VPS.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Run build script
Write-Host "[3/3] Running build on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 5-7 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_DEPENDENCIES_VPS.sh && /root/FIX_DEPENDENCIES_VPS.sh"

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
    exit 1
}

