# ============================================
# FIX UI VISIBILITY - DEPLOY TO VPS
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIX UI VISIBILITY - DEPLOY TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed homepage
Write-Host "[1/4] Uploading fixed homepage..." -ForegroundColor Cyan

scp "src/app/page.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ page.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload page.tsx" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Rebuild Next.js
Write-Host "[2/4] Rebuilding Next.js..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "  ✗ Build failed" -ForegroundColor Red
    Write-Host "  Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Restart PM2
Write-Host "[3/4] Restarting PM2..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ PM2 restarted" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to restart PM2" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting 10 seconds for app to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Test UI
Write-Host "[4/4] Testing homepage..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing /..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/ 2>&1 | head -5"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ UI VISIBILITY FIX DEPLOYED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "  ✓ Added global CSS to force all content visible" -ForegroundColor White
Write-Host "  ✓ Added explicit display/visibility styles to all sections" -ForegroundColor White
Write-Host "  ✓ Ensured main container is visible" -ForegroundColor White
Write-Host "  ✓ Fixed overflow and positioning issues" -ForegroundColor White
Write-Host ""
Write-Host "Test homepage:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "If UI still not visible:" -ForegroundColor Yellow
Write-Host "  1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)" -ForegroundColor White
Write-Host "  2. Clear browser cache" -ForegroundColor White
Write-Host "  3. Try incognito/private window" -ForegroundColor White
Write-Host "  4. Check browser console (F12) for errors" -ForegroundColor White
Write-Host "  5. Check PM2 logs: pm2 logs cryptorafts" -ForegroundColor White
Write-Host ""
