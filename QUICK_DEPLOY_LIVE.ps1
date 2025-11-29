# ============================================
# QUICK DEPLOY TO VPS - LIVE NOW
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 QUICK DEPLOY TO VPS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_USER = "root"
$VPS_IP = "72.61.98.99"
$VPS_PATH = "/var/www/cryptorafts"

# Step 1: Build
Write-Host "[1/3] Building..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
$env:NODE_ENV = "production"
npm run build

if (-not (Test-Path ".next")) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Upload
Write-Host "[2/3] Uploading .next folder..." -ForegroundColor Yellow
scp -r .next ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
Write-Host "✅ Upload complete!" -ForegroundColor Green
Write-Host ""

# Step 3: Restart
Write-Host "[3/3] Restarting on VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd ${VPS_PATH} && pm2 restart cryptorafts && pm2 logs cryptorafts --lines 10 --nostream"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYED LIVE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Your app is live at:" -ForegroundColor Yellow
Write-Host "   http://${VPS_IP}:3000" -ForegroundColor White
Write-Host "   https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "Hard refresh: Ctrl + Shift + R" -ForegroundColor Cyan
Write-Host ""


