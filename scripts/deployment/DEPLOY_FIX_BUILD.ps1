# ============================================
# DEPLOY BUILD FIX
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING BUILD FIX" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Upload fix script
Write-Host "[1/2] Uploading fix script..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp FIX_BUILD_ERRORS.sh "${vpsUser}@${vpsIp}:/root/FIX_BUILD_ERRORS.sh"

# Run fix script
Write-Host ""
Write-Host "[2/2] Running fix script..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
Write-Host "   This will take 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_BUILD_ERRORS.sh && /root/FIX_BUILD_ERRORS.sh"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ BUILD FIX DEPLOYED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host ""
Write-Host "Note: 'Loading spotlights...' is normal - it shows for 1-2 seconds while data loads." -ForegroundColor White
Write-Host ""

