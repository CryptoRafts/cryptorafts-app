# ============================================
# DEPLOY FIRESTORE CORS FIX
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIRESTORE CORS FIX" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Upload fixed SpotlightDisplay component
Write-Host "[1/3] Uploading fixed SpotlightDisplay component..." -ForegroundColor Cyan
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SpotlightDisplay.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload SpotlightDisplay.tsx" -ForegroundColor Red
    exit 1
}

# Upload diagnostic script
Write-Host ""
Write-Host "[2/3] Uploading diagnostic script..." -ForegroundColor Cyan
scp FIX_FIRESTORE_CORS.sh "${vpsUser}@${vpsIp}:/root/FIX_FIRESTORE_CORS.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Diagnostic script uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload diagnostic script" -ForegroundColor Red
    exit 1
}

# Run diagnostic and rebuild
Write-Host ""
Write-Host "[3/3] Running diagnostic and rebuilding..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_FIRESTORE_CORS.sh && cd ${vpsPath} && npm run build && pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build and restart complete" -ForegroundColor Green
} else {
    Write-Host "❌ Build or restart failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Add www.cryptorafts.com to Firebase Console" -ForegroundColor Yellow
Write-Host ""
Write-Host "To fix CORS errors:" -ForegroundColor White
Write-Host "1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings" -ForegroundColor White
Write-Host "2. Scroll to 'Authorized domains'" -ForegroundColor White
Write-Host "3. Add: www.cryptorafts.com" -ForegroundColor White
Write-Host "4. Add: cryptorafts.com (if not already there)" -ForegroundColor White
Write-Host "5. Save changes" -ForegroundColor White
Write-Host "6. Wait 1-2 minutes for changes to propagate" -ForegroundColor White
Write-Host "7. Refresh your browser" -ForegroundColor White
Write-Host ""

