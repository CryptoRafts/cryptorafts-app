# ============================================
# DEPLOY COMPLETE APP FIX
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING COMPLETE APP FIX" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Upload all fixed files
Write-Host "[1/6] Uploading SpotlightDisplay.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"

Write-Host ""
Write-Host "[2/6] Uploading PerfectHeader.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/components/PerfectHeader.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/PerfectHeader.tsx"

Write-Host ""
Write-Host "[3/6] Uploading SimpleAuthProvider.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/providers/SimpleAuthProvider.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/providers/SimpleAuthProvider.tsx"

Write-Host ""
Write-Host "[4/6] Uploading page.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/app/page.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"

Write-Host ""
Write-Host "[5/6] Uploading globals.css..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/app/globals.css "${vpsUser}@${vpsIp}:${vpsPath}/src/app/globals.css"

Write-Host ""
Write-Host "[6/6] Uploading fix script and rebuilding..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
Write-Host "   This will take 2-3 minutes..." -ForegroundColor Yellow
scp FIX_COMPLETE_APP.sh "${vpsUser}@${vpsIp}:/root/FIX_COMPLETE_APP.sh"
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_COMPLETE_APP.sh && /root/FIX_COMPLETE_APP.sh"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ COMPLETE APP FIX DEPLOYED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "  - Or open in Incognito/Private mode" -ForegroundColor White
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Yellow
Write-Host "  ✅ SpotlightDisplay shows content immediately when data loads" -ForegroundColor White
Write-Host "  ✅ Loading state clears instantly" -ForegroundColor White
Write-Host "  ✅ All timeouts reduced for faster loading" -ForegroundColor White
Write-Host "  ✅ Complete cache clear and rebuild" -ForegroundColor White
Write-Host ""
