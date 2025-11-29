# ============================================
# CRYPTORAFTS - FIX HOMEPAGE RENDER
# Uploads fixed homepage and rebuilds
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - FIX HOMEPAGE RENDER" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Uploading fixed homepage..." -ForegroundColor Yellow

# Create directory structure on VPS first
Write-Host "Creating directory structure on VPS..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIP}" "mkdir -p ${appDir}/src/app" 2>&1 | Out-Null

# Upload fixed homepage
if (Test-Path "src/app/page.tsx") {
    Write-Host "Uploading src/app/page.tsx..." -ForegroundColor Cyan
    scp src/app/page.tsx "${vpsUser}@${vpsIP}:${appDir}/src/app/page.tsx" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Homepage uploaded" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to upload homepage" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: src/app/page.tsx not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Rebuilding and restarting..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

# Execute rebuild commands on VPS
$rebuildCommands = @(
    "cd $appDir",
    "source ~/.nvm/nvm.sh 2>/dev/null || true",
    "nvm use 20 2>/dev/null || export PATH=/root/.nvm/versions/node/v20.*/bin:`$PATH",
    "npm run build",
    "pm2 restart cryptorafts"
)

$fullCommand = ($rebuildCommands -join " && ")

ssh "${vpsUser}@${vpsIP}" $fullCommand

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: HOMEPAGE FIX DEPLOYED!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host " https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Fixes applied:" -ForegroundColor Green
    Write-Host "  - Removed blocking loading screen" -ForegroundColor Green
    Write-Host "  - Fixed z-index for content visibility" -ForegroundColor Green
    Write-Host "  - Content now renders immediately" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the SSH output above for any errors." -ForegroundColor Yellow
}

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

