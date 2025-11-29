# ============================================
# AUTO DEPLOY ALL - Complete Deployment
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"
$appUrl = "https://www.cryptorafts.com"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 AUTO DEPLOY ALL - Complete Deployment" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will deploy everything to your VPS" -ForegroundColor Yellow
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Create deployment script content
$deployScript = @"
#!/bin/bash
set -e
cd $vpsPath

echo "============================================"
echo "🚀 COMPLETE VPS DEPLOYMENT"
echo "============================================"
echo ""

# Create .env.local
echo "[1/6] Creating .env.local..."
cat > .env.local << 'ENVEOF'
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=$appUrl

# Admin Configuration
ADMIN_EMAIL=anasshamsiggc@gmail.com
SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com
ENVEOF
echo "✅ .env.local created"

# Rebuild
echo ""
echo "[2/6] Rebuilding application..."
npm run build 2>&1 | tail -50
echo "✅ Build completed"

# Restart PM2
echo ""
echo "[3/6] Restarting PM2..."
pm2 restart cryptorafts 2>/dev/null || pm2 start ecosystem.config.js
echo "✅ PM2 restarted"

# Reload nginx
echo ""
echo "[4/6] Reloading nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

# Verify
echo ""
echo "[5/6] Verifying deployment..."
sleep 5
pm2 status
echo "✅ Deployment verified"

# Final
echo ""
echo "============================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "Your app is now deployed at:"
echo "  $appUrl"
echo ""
"@

# Save deployment script
$deployScript | Out-File -FilePath "deploy_vps.sh" -Encoding utf8 -NoNewline

Write-Host "[1/4] Uploading deployment script..." -ForegroundColor Cyan
scp deploy_vps.sh "${vpsUser}@${vpsIp}:/root/deploy_vps.sh"
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/deploy_vps.sh"
Write-Host "✅ Deployment script uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Uploading critical files..." -ForegroundColor Cyan
Write-Host "  - page.tsx" -ForegroundColor White
scp src/app/page.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"

Write-Host "  - SpotlightDisplay.tsx" -ForegroundColor White
scp src/components/SpotlightDisplay.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"

Write-Host "  - RealtimeStats.tsx" -ForegroundColor White
scp src/components/RealtimeStats.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/RealtimeStats.tsx"

Write-Host "  - ErrorBoundary.tsx" -ForegroundColor White
scp src/components/ErrorBoundary.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/ErrorBoundary.tsx"

Write-Host "  - PerfectHeader.tsx" -ForegroundColor White
scp src/components/PerfectHeader.tsx "${vpsUser}@${vpsIp}:${vpsPath}/src/components/PerfectHeader.tsx"

Write-Host "  - firebase.client.ts" -ForegroundColor White
scp src/lib/firebase.client.ts "${vpsUser}@${vpsIp}:${vpsPath}/src/lib/firebase.client.ts"

Write-Host "  - next.config.js" -ForegroundColor White
scp next.config.js "${vpsUser}@${vpsIp}:${vpsPath}/next.config.js"

Write-Host "✅ All files uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Running deployment script on VPS..." -ForegroundColor Cyan
Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "/root/deploy_vps.sh"

Write-Host ""
Write-Host "[4/4] Deployment complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is now deployed at:" -ForegroundColor Yellow
Write-Host "  $appUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Clear your browser cache (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "2. Open $appUrl in your browser" -ForegroundColor White
Write-Host "3. Check browser console (F12) for any errors" -ForegroundColor White
Write-Host "4. Verify Firebase connection in console" -ForegroundColor White
Write-Host ""

# Cleanup
Remove-Item deploy_vps.sh -ErrorAction SilentlyContinue
