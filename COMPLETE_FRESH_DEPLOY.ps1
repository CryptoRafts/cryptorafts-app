# ============================================
# COMPLETE FRESH DEPLOYMENT
# Clears VPS and deploys everything fresh
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "COMPLETE FRESH DEPLOYMENT" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  This will CLEAR everything on VPS and start fresh!" -ForegroundColor Red
Write-Host ""

# Step 1: Upload setup script
Write-Host "[1/5] Uploading setup script..." -ForegroundColor Cyan
if (Test-Path "FRESH_VPS_SETUP.sh") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "FRESH_VPS_SETUP.sh" "${vpsUser}@${vpsIp}:/root/FRESH_VPS_SETUP.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Setup script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] FRESH_VPS_SETUP.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Stop and clear old app
Write-Host "[2/5] Stopping and clearing old app..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" @"
pm2 stop cryptorafts 2>/dev/null || true
pm2 delete cryptorafts 2>/dev/null || true
rm -rf ${vpsPath}
mkdir -p ${vpsPath}
echo '✅ Old app cleared'
"@
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Old app cleared" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Clear had issues (may be OK if nothing exists)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Upload complete app
Write-Host "[3/5] Uploading complete application..." -ForegroundColor Cyan
Write-Host "  This takes 3-5 minutes..." -ForegroundColor Yellow
& ".\UPLOAD_COMPLETE_APP.ps1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] App uploaded" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Install and build on VPS
Write-Host "[4/5] Installing dependencies and building..." -ForegroundColor Cyan
Write-Host "  This takes 5-7 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath} && echo 'Installing dependencies...' && npm install && echo 'Building application...' && npm run build && echo '✅ Build complete'"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build complete" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Start PM2
Write-Host "[5/5] Starting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" @"
cd ${vpsPath}
pm2 start npm --name cryptorafts -- start
pm2 save
pm2 startup
echo '✅ PM2 started'
"@
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] PM2 started" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] PM2 start failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Wait and check
Write-Host "Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] FRESH DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was done:" -ForegroundColor Cyan
Write-Host "  [OK] Cleared old application" -ForegroundColor White
Write-Host "  [OK] Uploaded complete application" -ForegroundColor White
Write-Host "  [OK] Installed dependencies" -ForegroundColor White
Write-Host "  [OK] Built application" -ForegroundColor White
Write-Host "  [OK] Started PM2" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "Check PM2 status:" -ForegroundColor Cyan
Write-Host "  ssh root@72.61.98.99 'pm2 status'" -ForegroundColor White
Write-Host ""

