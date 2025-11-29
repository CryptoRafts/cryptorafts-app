# ============================================
# QUICK DEPLOY - Shows commands to run
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "QUICK DEPLOY INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands ONE AT A TIME:" -ForegroundColor White
Write-Host ""
Write-Host "1. Upload files:" -ForegroundColor Cyan
Write-Host "   scp src/components/SpotlightDisplay.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/SpotlightDisplay.tsx" -ForegroundColor White
Write-Host "   scp src/components/PerfectHeader.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/PerfectHeader.tsx" -ForegroundColor White
Write-Host "   scp src/providers/SimpleAuthProvider.tsx root@72.61.98.99:/var/www/cryptorafts/src/providers/SimpleAuthProvider.tsx" -ForegroundColor White
Write-Host "   scp src/app/page.tsx root@72.61.98.99:/var/www/cryptorafts/src/app/page.tsx" -ForegroundColor White
Write-Host ""
Write-Host "2. SSH and rebuild:" -ForegroundColor Cyan
Write-Host "   ssh root@72.61.98.99" -ForegroundColor White
Write-Host "   cd /var/www/cryptorafts && npm run build && pm2 restart cryptorafts" -ForegroundColor White
Write-Host ""
Write-Host "3. Verify:" -ForegroundColor Cyan
Write-Host "   Open: https://www.cryptorafts.com" -ForegroundColor White
Write-Host "   Press Ctrl+Shift+R to refresh" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
