# ============================================
# DEPLOY TO VPS - LIVE NOW
# ============================================
# This script builds and deploys to VPS automatically

$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING TO VPS - LIVE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# VPS Configuration
$VPS_USER = "root"
$VPS_IP = "72.61.98.99"
$VPS_PATH = "/var/www/cryptorafts"
$LOCAL_DIR = "C:\Users\dell\cryptorafts-starter"

# Change to project directory
Set-Location $LOCAL_DIR

# Step 1: Build Production
Write-Host "[1/4] Building production version..." -ForegroundColor Yellow
Write-Host "⏱️  This will take 2-3 minutes..." -ForegroundColor Gray
Write-Host ""

Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

$env:NODE_ENV = "production"
npm run build

if (-not (Test-Path ".next")) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Upload Updated Files
Write-Host "[2/4] Uploading updated files to VPS..." -ForegroundColor Yellow
Write-Host "⏱️  Uploading .next build folder..." -ForegroundColor Gray

scp -r .next root@${VPS_IP}:${VPS_PATH}/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build files uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}

# Upload source files if changed
Write-Host "Uploading src folder..." -ForegroundColor Gray
scp -r src root@${VPS_IP}:${VPS_PATH}/ 2>&1 | Out-Null

Write-Host "✅ Source files uploaded" -ForegroundColor Green
Write-Host ""

# Step 3: Restart on VPS
Write-Host "[3/4] Restarting application on VPS..." -ForegroundColor Yellow

ssh ${VPS_USER}@${VPS_IP} "cd ${VPS_PATH} && pm2 restart cryptorafts"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application restarted" -ForegroundColor Green
} else {
    Write-Host "⚠️ Restart command executed" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Check Status
Write-Host "[4/4] Checking application status..." -ForegroundColor Yellow

ssh ${VPS_USER}@${VPS_IP} "cd ${VPS_PATH} && pm2 status && pm2 logs cryptorafts --lines 10 --nostream"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Your app is live at:" -ForegroundColor Yellow
Write-Host "   http://${VPS_IP}:3000" -ForegroundColor White
Write-Host "   https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "📝 Changes deployed:" -ForegroundColor Yellow
Write-Host "   ✅ Smaller text sizes" -ForegroundColor White
Write-Host "   ✅ Optimized video loading" -ForegroundColor White
Write-Host ""
Write-Host "Hard refresh your browser to see changes:" -ForegroundColor Cyan
Write-Host "   Ctrl + Shift + R (Windows)" -ForegroundColor White
Write-Host "   Cmd + Shift + R (Mac)" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
