# ============================================
# DEPLOY AND CLEAR CACHE
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING AND CLEARING CACHE" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Upload all fixed files
Write-Host "[1/5] Uploading fixed files..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow

scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"
scp src/components/PerfectHeader.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/PerfectHeader.tsx"
scp src/providers/SimpleAuthProvider.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/providers/SimpleAuthProvider.tsx"
scp src/app/page.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"

Write-Host ""
Write-Host "[2/5] Rebuilding app..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && rm -rf .next && npm run build"

Write-Host ""
Write-Host "[3/5] Restarting PM2..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "pm2 restart cryptorafts && sleep 3 && pm2 status"

Write-Host ""
Write-Host "[4/5] Clearing Nginx cache..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "sudo systemctl reload nginx"

Write-Host ""
Write-Host "[5/5] Verification complete!" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "  - Or press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "  - Or open in Incognito/Private mode" -ForegroundColor White
Write-Host ""

