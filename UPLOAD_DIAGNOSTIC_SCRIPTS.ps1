# ============================================
# UPLOAD DIAGNOSTIC SCRIPTS TO VPS
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📤 UPLOADING DIAGNOSTIC SCRIPTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_USER = "root"
$VPS_IP = "72.61.98.99"
$VPS_PATH = "/var/www/cryptorafts"

# Upload diagnostic scripts
Write-Host "Uploading diagnostic scripts..." -ForegroundColor Yellow

scp CHECK_VPS_PROBLEMS.sh ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
scp FIX_VPS_PROBLEMS.sh ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
scp MONITOR_VPS.sh ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

Write-Host "✅ Scripts uploaded!" -ForegroundColor Green
Write-Host ""

Write-Host "Now run on VPS:" -ForegroundColor Yellow
Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "cd ${VPS_PATH}" -ForegroundColor White
Write-Host "chmod +x CHECK_VPS_PROBLEMS.sh FIX_VPS_PROBLEMS.sh MONITOR_VPS.sh" -ForegroundColor White
Write-Host "./CHECK_VPS_PROBLEMS.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or run fix script:" -ForegroundColor Yellow
Write-Host "./FIX_VPS_PROBLEMS.sh" -ForegroundColor Cyan
Write-Host ""

