# ============================================
# CRYPTORAFTS - DEPLOY ULTRA FIX
# Deploys homepage with ultra-aggressive CSS
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - DEPLOY ULTRA FIX" -ForegroundColor Cyan
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
Write-Host "Step 3: Rebuilding and restarting..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

# Execute rebuild
$rebuildCmd = @"
cd $appDir
source ~/.nvm/nvm.sh 2>/dev/null || true
nvm use 20 2>/dev/null || export PATH=/root/.nvm/versions/node/v20.*/bin:`$PATH
npm run build
pm2 restart cryptorafts
sleep 5
pm2 status
pm2 logs cryptorafts --lines 10 --nostream
"@

$rebuildCmd | ssh "${vpsUser}@${vpsIP}" bash

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: ULTRA FIX DEPLOYED!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host " https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ultra-aggressive CSS fixes applied:" -ForegroundColor Green
    Write-Host "  - All content elements forced visible" -ForegroundColor Green
    Write-Host "  - Z-index 999 for all content" -ForegroundColor Green
    Write-Host "  - Opacity and visibility forced" -ForegroundColor Green
    Write-Host "  - Display block forced for all elements" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
}

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

