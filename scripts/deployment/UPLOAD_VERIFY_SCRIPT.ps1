# ============================================
# UPLOAD VERIFICATION SCRIPT
# ============================================

Write-Host "Uploading verification script..." -ForegroundColor Yellow

$VPS_USER = "root"
$VPS_IP = "72.61.98.99"
$VPS_PATH = "/var/www/cryptorafts"

scp VERIFY_ALL_FIXES.sh ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

Write-Host "✅ Script uploaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run on VPS:" -ForegroundColor Yellow
Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "cd ${VPS_PATH}" -ForegroundColor White
Write-Host "chmod +x VERIFY_ALL_FIXES.sh" -ForegroundColor White
Write-Host "./VERIFY_ALL_FIXES.sh" -ForegroundColor Cyan
Write-Host ""

