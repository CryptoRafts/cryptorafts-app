# ============================================
# CRYPTORAFTS - DEPLOY FINAL FIX
# Uses working rebuild script method
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - DEPLOY FINAL FIX" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Creating directory structure..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIP}" "mkdir -p ${appDir}/src/app" 2>&1 | Out-Null

Write-Host ""
Write-Host "Step 2: Uploading fixed homepage..." -ForegroundColor Yellow

if (Test-Path "src/app/page.tsx") {
    Write-Host "Uploading src/app/page.tsx..." -ForegroundColor Cyan
    scp src/app/page.tsx "${vpsUser}@${vpsIP}:${appDir}/src/app/page.tsx"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Homepage uploaded" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to upload homepage" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: src/app/page.tsx not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Uploading rebuild script..." -ForegroundColor Yellow

# Upload rebuild script
if (Test-Path "REBUILD_ON_VPS.sh") {
    Write-Host "Uploading REBUILD_ON_VPS.sh..." -ForegroundColor Cyan
    scp REBUILD_ON_VPS.sh "${vpsUser}@${vpsIP}:${appDir}/REBUILD_ON_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Rebuild script uploaded" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to upload rebuild script" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: REBUILD_ON_VPS.sh not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Rebuilding and restarting..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

# Execute rebuild using the working script
ssh "${vpsUser}@${vpsIP}" "cd ${appDir} && dos2unix REBUILD_ON_VPS.sh 2>/dev/null || sed -i 's/\r$//' REBUILD_ON_VPS.sh 2>/dev/null || true && chmod +x REBUILD_ON_VPS.sh && bash REBUILD_ON_VPS.sh"

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: FINAL FIX DEPLOYED!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host " https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Fixes applied:" -ForegroundColor Green
    Write-Host "  - Hydration fix (suppressHydrationWarning)" -ForegroundColor Green
    Write-Host "  - React error #418 fixed" -ForegroundColor Green
    Write-Host "  - UI unchanged" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the SSH output above for any errors." -ForegroundColor Yellow
}

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
