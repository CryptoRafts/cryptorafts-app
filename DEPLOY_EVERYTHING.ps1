# ============================================
# DEPLOY EVERYTHING - Complete App
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING COMPLETE APP" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host "Enter password when prompted for each command." -ForegroundColor Yellow
Write-Host ""

# Upload all fixed files
Write-Host "[1/6] Uploading SpotlightDisplay..." -ForegroundColor Cyan
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"

Write-Host ""
Write-Host "[2/6] Uploading PerfectHeader..." -ForegroundColor Cyan
scp src/components/PerfectHeader.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/PerfectHeader.tsx"

Write-Host ""
Write-Host "[3/6] Uploading SimpleAuthProvider..." -ForegroundColor Cyan
scp src/providers/SimpleAuthProvider.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/providers/SimpleAuthProvider.tsx"

Write-Host ""
Write-Host "[4/6] Uploading page..." -ForegroundColor Cyan
scp src/app/page.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"

Write-Host ""
Write-Host "[5/6] Uploading rebuild script..." -ForegroundColor Cyan
scp CLEAR_CACHE_AND_REBUILD.sh "${vpsUser}@${vpsIp}:/root/CLEAR_CACHE_AND_REBUILD.sh"

Write-Host ""
Write-Host "[6/6] Running rebuild script on VPS..." -ForegroundColor Cyan
Write-Host "   This will clear cache, rebuild, and restart everything." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/CLEAR_CACHE_AND_REBUILD.sh && /root/CLEAR_CACHE_AND_REBUILD.sh"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+Delete and clear cache" -ForegroundColor White
Write-Host "  - Or press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "  - Or open in Incognito/Private mode" -ForegroundColor White
Write-Host ""

