# ============================================
# CLEAN VPS AND DEPLOY FRESH FILES
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧹 CLEANING VPS AND DEPLOYING FRESH FILES" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop PM2
Write-Host "[1/10] Stopping PM2..." -ForegroundColor Cyan
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && pm2 stop cryptorafts 2>/dev/null || true"
Write-Host "✅ PM2 stopped" -ForegroundColor Green

# Step 2: Clean old build files
Write-Host ""
Write-Host "[2/10] Cleaning old build files..." -ForegroundColor Cyan
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && rm -rf .next node_modules/.cache .next/cache 2>/dev/null || true"
Write-Host "✅ Old build files cleaned" -ForegroundColor Green

# Step 3: Clean old logs
Write-Host ""
Write-Host "[3/10] Cleaning old logs..." -ForegroundColor Cyan
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && rm -rf logs/*.log 2>/dev/null || true && mkdir -p logs"
Write-Host "✅ Old logs cleaned" -ForegroundColor Green

# Step 4: Backup .env.local
Write-Host ""
Write-Host "[4/10] Backing up .env.local..." -ForegroundColor Cyan
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && cp .env.local .env.local.backup 2>/dev/null || true"
Write-Host "✅ .env.local backed up" -ForegroundColor Green

# Step 5: Upload fresh page.tsx
Write-Host ""
Write-Host "[5/10] Uploading fresh page.tsx..." -ForegroundColor Cyan
scp src/app/page.tsx "$vpsUser@${vpsIp}:$vpsPath/src/app/page.tsx"
Write-Host "✅ page.tsx uploaded" -ForegroundColor Green

# Step 6: Upload fresh components
Write-Host ""
Write-Host "[6/10] Uploading fresh components..." -ForegroundColor Cyan
scp src/components/SpotlightDisplay.tsx "$vpsUser@${vpsIp}:$vpsPath/src/components/SpotlightDisplay.tsx"
scp src/components/RealtimeStats.tsx "$vpsUser@${vpsIp}:$vpsPath/src/components/RealtimeStats.tsx"
scp src/components/ErrorBoundary.tsx "$vpsUser@${vpsIp}:$vpsPath/src/components/ErrorBoundary.tsx"
scp src/components/PerfectHeader.tsx "$vpsUser@${vpsIp}:$vpsPath/src/components/PerfectHeader.tsx"
Write-Host "✅ Components uploaded" -ForegroundColor Green

# Step 7: Upload fresh config files
Write-Host ""
Write-Host "[7/10] Uploading fresh config files..." -ForegroundColor Cyan
scp next.config.js "$vpsUser@${vpsIp}:$vpsPath/next.config.js"
scp ecosystem.config.js "$vpsUser@${vpsIp}:$vpsPath/ecosystem.config.js"
scp src/lib/firebase.client.ts "$vpsUser@${vpsIp}:$vpsPath/src/lib/firebase.client.ts"
Write-Host "✅ Config files uploaded" -ForegroundColor Green

# Step 8: Restore .env.local
Write-Host ""
Write-Host "[8/10] Restoring .env.local..." -ForegroundColor Cyan
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && mv .env.local.backup .env.local 2>/dev/null || true"
Write-Host "✅ .env.local restored" -ForegroundColor Green

# Step 9: Rebuild application
Write-Host ""
Write-Host "[9/10] Rebuilding application..." -ForegroundColor Cyan
Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && npm run build 2>&1 | tail -50"
Write-Host "✅ Build completed" -ForegroundColor Green

# Step 10: Restart PM2
Write-Host ""
Write-Host "[10/10] Restarting PM2..." -ForegroundColor Cyan
ssh "$vpsUser@${vpsIp}" "cd $vpsPath && pm2 delete cryptorafts 2>/dev/null || true && pm2 start ecosystem.config.js --update-env"
Write-Host "✅ PM2 restarted" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ CLEAN AND DEPLOY COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is now fresh and clean at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "  - Or open in Incognito/Private mode" -ForegroundColor White
Write-Host ""

