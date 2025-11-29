# ============================================
# UPLOAD MEMORY FIX TO VPS
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📤 UPLOADING MEMORY FIX TO VPS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_USER = "root"
$VPS_IP = "72.61.98.99"
$VPS_PATH = "/var/www/cryptorafts"

Write-Host "Uploading memory fix script..." -ForegroundColor Yellow
scp FIX_MEMORY_CRITICAL.sh ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

Write-Host "✅ Script uploaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run on VPS:" -ForegroundColor Yellow
Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "cd ${VPS_PATH}" -ForegroundColor White
Write-Host "chmod +x FIX_MEMORY_CRITICAL.sh" -ForegroundColor White
Write-Host "./FIX_MEMORY_CRITICAL.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or copy-paste commands from FIX_MEMORY_CRITICAL.txt" -ForegroundColor Yellow
Write-Host ""

