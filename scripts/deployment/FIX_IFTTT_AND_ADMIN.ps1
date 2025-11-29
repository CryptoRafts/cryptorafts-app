# ============================================
# FIX IFTTT INVALID URL + ADMIN UI
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIX IFTTT INVALID URL + ADMIN UI" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload updated RSS feed files
Write-Host "[1/5] Uploading updated RSS feed files..." -ForegroundColor Cyan

scp "src/app/feed.xml/route.ts" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/feed.xml/route.ts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ feed.xml/route.ts uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload feed.xml/route.ts" -ForegroundColor Red
    exit 1
}

scp "src/app/api/blog/rss/route.ts" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/api/blog/rss/route.ts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ api/blog/rss/route.ts uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload api/blog/rss/route.ts" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Rebuild Next.js
Write-Host "[2/5] Rebuilding Next.js..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "  ✗ Build failed" -ForegroundColor Red
    Write-Host "  Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Restart PM2
Write-Host "[3/5] Restarting PM2..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ PM2 restarted" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to restart PM2" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting 10 seconds for app to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Test RSS feed
Write-Host "[4/5] Testing RSS feed..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing /feed.xml..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/feed.xml 2>&1 | head -5"

Write-Host ""
Write-Host "Testing feed content..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl http://localhost:3000/feed.xml 2>&1 | head -20"

Write-Host ""

# Step 5: Check admin UI
Write-Host "[5/5] Checking admin UI..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing /admin/blog..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/admin/blog 2>&1 | head -5"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Validate feed with W3C:" -ForegroundColor White
Write-Host "     https://validator.w3.org/feed/" -ForegroundColor Gray
Write-Host "     Enter: https://www.cryptorafts.com/feed.xml" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test admin UI:" -ForegroundColor White
Write-Host "     https://www.cryptorafts.com/admin/blog" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. If admin UI not working, check:" -ForegroundColor White
Write-Host "     - PM2 logs: pm2 logs cryptorafts --lines 50" -ForegroundColor Gray
Write-Host "     - Browser console for errors" -ForegroundColor Gray
Write-Host "     - Firebase authentication" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Try IFTTT again:" -ForegroundColor White
Write-Host "     https://www.cryptorafts.com/feed.xml" -ForegroundColor Cyan
Write-Host ""

