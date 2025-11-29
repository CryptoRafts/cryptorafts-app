# Complete Automatic Deployment Fix
# This script uploads and runs the fix automatically

$VPS_IP = "72.61.98.99"
$VPS_USER = "root"
$REMOTE_PATH = "/var/www/cryptorafts"
$SCRIPT_NAME = "FIX_EVERYTHING_AUTO.sh"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "COMPLETE AUTOMATIC DEPLOYMENT FIX" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Uploading fix script..." -ForegroundColor Yellow
scp "$SCRIPT_NAME" "${VPS_USER}@${VPS_IP}:${REMOTE_PATH}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Script uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 2: Running fix script on VPS..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd ${REMOTE_PATH} && chmod +x ${SCRIPT_NAME} && bash ${SCRIPT_NAME}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Fix completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Fix failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT FIX COMPLETE!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache now!" -ForegroundColor Yellow
Write-Host "1. Press Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "2. Select 'All time'" -ForegroundColor White
Write-Host "3. Check 'Cached images and files'" -ForegroundColor White
Write-Host "4. Click 'Clear data'" -ForegroundColor White
Write-Host ""
Write-Host "Or test in incognito/private mode!" -ForegroundColor Yellow
Write-Host ""

