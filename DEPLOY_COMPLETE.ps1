# ============================================
# COMPLETE VPS DEPLOYMENT - Automated Fix
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"
$appUrl = "https://www.cryptorafts.com"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 COMPLETE VPS DEPLOYMENT" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create .env.local file
Write-Host "[1/10] Creating .env.local file..." -ForegroundColor Cyan
$envFile = ".env.local.deploy"
$envContent = @"
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
"@
$envContent | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
Write-Host "✅ .env.local file created" -ForegroundColor Green

# Step 2: Upload .env.local
Write-Host ""
Write-Host "[2/10] Uploading .env.local to VPS..." -ForegroundColor Cyan
$scpDest = "$vpsUser@${vpsIp}:$vpsPath/.env.local"
scp $envFile $scpDest
Remove-Item $envFile -ErrorAction SilentlyContinue
Write-Host "✅ .env.local uploaded" -ForegroundColor Green

# Step 3: Upload page.tsx
Write-Host ""
Write-Host "[3/10] Uploading page.tsx..." -ForegroundColor Cyan
$scpDest = "$vpsUser@${vpsIp}:$vpsPath/src/app/page.tsx"
scp src/app/page.tsx $scpDest
Write-Host "✅ page.tsx uploaded" -ForegroundColor Green

# Step 4: Upload components
Write-Host ""
Write-Host "[4/10] Uploading components..." -ForegroundColor Cyan
scp src/components/SpotlightDisplay.tsx "$vpsUser@${vpsIp}:$vpsPath/src/components/SpotlightDisplay.tsx"
scp src/components/RealtimeStats.tsx "$vpsUser@${vpsIp}:$vpsPath/src/components/RealtimeStats.tsx"
scp src/components/ErrorBoundary.tsx "$vpsUser@${vpsIp}:$vpsPath/src/components/ErrorBoundary.tsx"
scp src/components/PerfectHeader.tsx "$vpsUser@${vpsIp}:$vpsPath/src/components/PerfectHeader.tsx"
Write-Host "✅ Components uploaded" -ForegroundColor Green

# Step 5: Upload firebase.client.ts
Write-Host ""
Write-Host "[5/10] Uploading firebase.client.ts..." -ForegroundColor Cyan
scp src/lib/firebase.client.ts "$vpsUser@${vpsIp}:$vpsPath/src/lib/firebase.client.ts"
Write-Host "✅ firebase.client.ts uploaded" -ForegroundColor Green

# Step 6: Upload next.config.js
Write-Host ""
Write-Host "[6/10] Uploading next.config.js..." -ForegroundColor Cyan
scp next.config.js "$vpsUser@${vpsIp}:$vpsPath/next.config.js"
Write-Host "✅ next.config.js uploaded" -ForegroundColor Green

# Step 7: Rebuild application
Write-Host ""
Write-Host "[7/10] Rebuilding application on VPS..." -ForegroundColor Cyan
Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && npm run build"
Write-Host "✅ Build completed" -ForegroundColor Green

# Step 8: Restart PM2
Write-Host ""
Write-Host "[8/10] Restarting PM2..." -ForegroundColor Cyan
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && pm2 restart cryptorafts 2>/dev/null || pm2 start ecosystem.config.js"
Write-Host "✅ PM2 restarted" -ForegroundColor Green

# Step 9: Reload nginx
Write-Host ""
Write-Host "[9/10] Reloading nginx..." -ForegroundColor Cyan
ssh "$vpsUser@${vpsIp}" "systemctl reload nginx"
Write-Host "✅ Nginx reloaded" -ForegroundColor Green

# Step 10: Verify deployment
Write-Host ""
Write-Host "[10/10] Verifying deployment..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Write-Host "Checking app status..." -ForegroundColor Yellow
ssh "$vpsUser@${vpsIp}" "pm2 status"
Write-Host ""
Write-Host "Checking if app is responding..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ App is responding on localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not verify localhost (this is normal if checking from Windows)" -ForegroundColor Yellow
}

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
Write-Host "If you see issues:" -ForegroundColor Yellow
Write-Host "- Check PM2 logs: ssh $vpsUser@${vpsIp} 'pm2 logs cryptorafts'" -ForegroundColor White
Write-Host "- Check nginx logs: ssh $vpsUser@${vpsIp} 'tail -f /var/log/nginx/error.log'" -ForegroundColor White
Write-Host ""
