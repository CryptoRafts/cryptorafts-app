# ============================================
# DEPLOY UI FIX - Complete
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING UI FIX - COMPLETE" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Upload all fixed files
Write-Host "[1/5] Uploading SpotlightDisplay.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"

Write-Host ""
Write-Host "[2/5] Uploading PerfectHeader.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/components/PerfectHeader.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/PerfectHeader.tsx"

Write-Host ""
Write-Host "[3/5] Uploading SimpleAuthProvider.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/providers/SimpleAuthProvider.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/providers/SimpleAuthProvider.tsx"

Write-Host ""
Write-Host "[4/5] Uploading page.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp src/app/page.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"

Write-Host ""
Write-Host "[5/5] Uploading fix script and rebuilding..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp FIX_UI_COMPLETE.sh "${vpsUser}@${vpsIp}:/root/FIX_UI_COMPLETE.sh"
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_UI_COMPLETE.sh && /root/FIX_UI_COMPLETE.sh"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ UI FIX DEPLOYED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "  - Or open in Incognito/Private mode" -ForegroundColor White
Write-Host ""

