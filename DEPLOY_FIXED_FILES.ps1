# ============================================
# DEPLOY FIXED FILES - Quick Deployment
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING FIXED FILES" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Upload fixed files
Write-Host "[1/5] Uploading fixed components..." -ForegroundColor Cyan
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"
scp src/components/RealtimeStats.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/RealtimeStats.tsx"
scp src/app/page.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"
Write-Host "✅ Files uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Rebuilding on VPS..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd $vpsPath && npm run build 2>&1 | tail -30"
Write-Host "✅ Build completed" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Restarting PM2..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd $vpsPath && pm2 restart cryptorafts"
Write-Host "✅ PM2 restarted" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Reloading nginx..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "systemctl reload nginx"
Write-Host "✅ Nginx reloaded" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Deployment complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is now fixed at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "  - Or open in Incognito/Private mode" -ForegroundColor White
Write-Host ""

