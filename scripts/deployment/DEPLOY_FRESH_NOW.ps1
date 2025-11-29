# ========================================
# DEPLOY FRESH BUILD NOW
# ========================================
# Quick deployment script

$ErrorActionPreference = "Stop"

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FRESH BUILD" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload critical files
Write-Host "Step 1: Uploading source files..." -ForegroundColor Yellow
Write-Host "   (You will be prompted for SSH password)" -ForegroundColor Gray
Write-Host ""

$filesToUpload = @("src", "public", "package.json", "next.config.js", "tsconfig.json", "ecosystem.config.js", "server.js")

foreach ($item in $filesToUpload) {
    if (Test-Path $item) {
        Write-Host "   Uploading: $item" -ForegroundColor Gray
        if (Test-Path $item -PathType Container) {
            scp -r $item "${vpsUser}@${vpsIp}:${vpsPath}/"
        } else {
            scp $item "${vpsUser}@${vpsIp}:${vpsPath}/"
        }
    }
}

Write-Host ""
Write-Host "Step 2: Running deployment on VPS..." -ForegroundColor Yellow
Write-Host ""

$deployCommand = 'cd /var/www/cryptorafts; pm2 stop cryptorafts || true; pm2 delete cryptorafts || true; rm -rf .next node_modules package-lock.json; npm install --production=false; npm run build; mkdir -p logs; pm2 start ecosystem.config.js; pm2 save; sleep 3; pm2 status'

ssh "${vpsUser}@${vpsIp}" $deployCommand

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please wait 1-2 minutes, then clear browser cache and visit the site" -ForegroundColor Yellow
Write-Host ""

