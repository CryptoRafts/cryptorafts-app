# ============================================
# UPLOAD PUBLIC ASSETS TO VPS
# This uploads all public folder assets
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"
$publicDir = "public"

Write-Host ""
Write-Host "UPLOADING PUBLIC ASSETS TO VPS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $publicDir)) {
    Write-Host "ERROR: $publicDir folder not found!" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Uploading public folder to VPS..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

# Create public directory on VPS
ssh "$vpsUser@$vpsIP" "mkdir -p $appDir/$publicDir" 2>&1 | Out-Null

# Upload entire public folder
Write-Host "Uploading all files from $publicDir..." -ForegroundColor Yellow
scp -r "$publicDir"/* "${vpsUser}@${vpsIP}:${appDir}/$publicDir/" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "SUCCESS: Public assets uploaded!" -ForegroundColor Green
Write-Host ""

# Restart PM2 to pick up new assets
Write-Host "Step 2: Restarting PM2..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd $appDir && pm2 restart cryptorafts" 2>&1

Write-Host ""
Write-Host "SUCCESS: PM2 restarted!" -ForegroundColor Green
Write-Host ""
Write-Host "Your assets should now be available at:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com/cryptorafts.logo%20(1).svg" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com/tablogo.ico" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com/Sequence%2001.mp4" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com/site.webmanifest" -ForegroundColor Yellow
Write-Host ""

