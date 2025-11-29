# ============================================
# DEPLOY RSS FEED FIX TO VPS
# ============================================

$VPS_IP = "72.61.98.99"
$VPS_USER = "root"
$VPS_PATH = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING RSS FEED FIX" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if next.config.js exists
if (-not (Test-Path "next.config.js")) {
    Write-Host "❌ ERROR: next.config.js not found!" -ForegroundColor Red
    exit 1
}

Write-Host "[1/2] Uploading updated next.config.js..." -ForegroundColor Yellow
scp "next.config.js" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/next.config.js"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload next.config.js" -ForegroundColor Red
    exit 1
}
Write-Host "✅ next.config.js uploaded" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ RSS FEED FIX UPLOADED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. SSH to VPS: ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "2. Restart app: pm2 restart cryptorafts" -ForegroundColor White
Write-Host "3. Test feed: curl -I http://localhost:3000/feed.xml" -ForegroundColor White
Write-Host ""
Write-Host "Or run these commands on VPS:" -ForegroundColor Yellow
Write-Host "cd ${VPS_PATH}" -ForegroundColor Cyan
Write-Host "pm2 restart cryptorafts" -ForegroundColor Cyan
Write-Host "sleep 3" -ForegroundColor Cyan
Write-Host "curl -I http://localhost:3000/feed.xml" -ForegroundColor Cyan
Write-Host "curl http://localhost:3000/feed.xml | head -20" -ForegroundColor Cyan
Write-Host ""
Write-Host "After testing, add to IFTTT:" -ForegroundColor Yellow
Write-Host "https://www.cryptorafts.com/feed.xml" -ForegroundColor Cyan
Write-Host ""

