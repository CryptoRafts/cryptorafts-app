# ============================================
# DEPLOY FAST LOADING FIX
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FAST LOADING FIX" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Upload fixed SpotlightDisplay
Write-Host "[1/3] Uploading optimized SpotlightDisplay..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"

# Rebuild and restart
Write-Host ""
Write-Host "[2/3] Rebuilding app..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm run build && pm2 restart cryptorafts"

Write-Host ""
Write-Host "[3/3] Verifying..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "sleep 3 && pm2 status"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ FAST LOADING FIX DEPLOYED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes:" -ForegroundColor Yellow
Write-Host "  - Reduced timeout from 12s to 3s" -ForegroundColor White
Write-Host "  - Query timeout reduced to 2s" -ForegroundColor White
Write-Host "  - Loading state clears immediately when data loads" -ForegroundColor White
Write-Host ""
Write-Host "Clear browser cache (Ctrl+Shift+R) to see changes." -ForegroundColor White
Write-Host ""













