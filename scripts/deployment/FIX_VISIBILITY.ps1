# ============================================
# CRYPTORAFTS - FIX CONTENT VISIBILITY
# Uploads fixed homepage with visibility fixes
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - FIX CONTENT VISIBILITY" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Creating directory structure..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIP}" "mkdir -p ${appDir}/src/app" 2>&1 | Out-Null

Write-Host ""
Write-Host "Step 2: Uploading fixed homepage..." -ForegroundColor Yellow

# Upload fixed homepage
if (Test-Path "src/app/page.tsx") {
    Write-Host "Uploading src/app/page.tsx..." -ForegroundColor Cyan
    scp src/app/page.tsx "${vpsUser}@${vpsIP}:${appDir}/src/app/page.tsx" 2>&1 | Out-Null
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
Write-Host "Step 3: Rebuilding application..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

# Execute rebuild commands
$rebuildCommands = @(
    "cd $appDir",
    "source ~/.nvm/nvm.sh 2>/dev/null || true",
    "nvm use 20 2>/dev/null || export PATH=/root/.nvm/versions/node/v20.*/bin:`$PATH",
    "npm run build",
    "pm2 restart cryptorafts",
    "pm2 status"
)

$fullCommand = ($rebuildCommands -join " && ")

ssh "${vpsUser}@${vpsIP}" $fullCommand

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: VISIBILITY FIX DEPLOYED!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host " https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Fixes applied:" -ForegroundColor Green
    Write-Host "  - Added explicit opacity and visibility styles" -ForegroundColor Green
    Write-Host "  - Increased z-index to 50 for content" -ForegroundColor Green
    Write-Host "  - Added CSS override to force visibility" -ForegroundColor Green
    Write-Host "  - All content elements now explicitly visible" -ForegroundColor Green
    Write-Host ""
    Write-Host "The homepage content should now be fully visible!" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the SSH output above for any errors." -ForegroundColor Yellow
}

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

