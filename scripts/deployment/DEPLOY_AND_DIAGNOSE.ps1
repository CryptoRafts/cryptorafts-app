# ============================================
# DEPLOY FIRESTORE FIX AND RUN DIAGNOSTIC
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIRESTORE FIX" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Upload fixed SpotlightDisplay component
Write-Host "[1/4] Uploading fixed SpotlightDisplay component..." -ForegroundColor Cyan
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SpotlightDisplay.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload SpotlightDisplay.tsx" -ForegroundColor Red
    exit 1
}

# Upload diagnostic script
Write-Host ""
Write-Host "[2/4] Uploading diagnostic script..." -ForegroundColor Cyan
scp DIAGNOSE_FIRESTORE_COMPLETE.sh "${vpsUser}@${vpsIp}:/root/DIAGNOSE_FIRESTORE_COMPLETE.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Diagnostic script uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload diagnostic script" -ForegroundColor Red
    exit 1
}

# Rebuild app
Write-Host ""
Write-Host "[3/4] Rebuilding app..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build complete" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Restart PM2 and run diagnostic
Write-Host ""
Write-Host "[4/4] Restarting app and running diagnostic..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "pm2 restart cryptorafts && sleep 3 && chmod +x /root/DIAGNOSE_FIRESTORE_COMPLETE.sh && /root/DIAGNOSE_FIRESTORE_COMPLETE.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App restarted and diagnostic complete" -ForegroundColor Green
} else {
    Write-Host "⚠️  Diagnostic completed with warnings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Since domains are already authorized, check:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. API Key Restrictions:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/apis/credentials?project=cryptorafts-b9067" -ForegroundColor Cyan
Write-Host "   - Find API key: AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14" -ForegroundColor White
Write-Host "   - Check 'Application restrictions'" -ForegroundColor White
Write-Host "   - If 'HTTP referrers' is set, add:" -ForegroundColor White
Write-Host "     * https://www.cryptorafts.com/*" -ForegroundColor Gray
Write-Host "     * https://cryptorafts.com/*" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Firestore Security Rules:" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules" -ForegroundColor Cyan
Write-Host "   - Verify spotlights collection has: allow read: if true;" -ForegroundColor White
Write-Host ""
Write-Host "3. Browser Console:" -ForegroundColor White
Write-Host "   - Open: https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host "   - Press F12 > Console tab" -ForegroundColor White
Write-Host "   - Look for specific error messages" -ForegroundColor White
Write-Host ""

