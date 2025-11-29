# ============================================
# DEPLOY RSS FEED FIX COMPLETE
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

Write-Host "[1/3] Uploading updated next.config.js..." -ForegroundColor Yellow
scp "next.config.js" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/next.config.js"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload next.config.js" -ForegroundColor Red
    exit 1
}
Write-Host "✅ next.config.js uploaded" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Verifying API endpoint exists..." -ForegroundColor Yellow
Write-Host "   Checking if /api/blog/rss/route.ts exists on VPS..." -ForegroundColor White
ssh ${VPS_USER}@${VPS_IP} "test -f ${VPS_PATH}/src/app/api/blog/rss/route.ts && echo '✅ RSS API route exists' || echo '❌ RSS API route missing'"

Write-Host ""
Write-Host "[3/3] Ready to restart!" -ForegroundColor Yellow
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ RSS FEED FIX UPLOADED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps (SSH to VPS):" -ForegroundColor Yellow
Write-Host "  ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor Cyan
Write-Host "  cd ${VPS_PATH}" -ForegroundColor Cyan
Write-Host "  pm2 restart cryptorafts" -ForegroundColor Cyan
Write-Host "  sleep 5" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then test:" -ForegroundColor Yellow
Write-Host "  # Test API endpoint (should work):" -ForegroundColor White
Write-Host "  curl -I http://localhost:3000/api/blog/rss" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Test feed.xml (should work after rewrite):" -ForegroundColor White
Write-Host "  curl -I http://localhost:3000/feed.xml" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Test from external:" -ForegroundColor White
Write-Host "  curl -I https://www.cryptorafts.com/feed.xml" -ForegroundColor Cyan
Write-Host ""

