# ============================================
# REBUILD AND FIX FEED.XML 404
# ============================================
# Next.js rewrites require a rebuild, not just restart

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "REBUILD AND FIX FEED.XML 404" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Next.js rewrites require a rebuild!" -ForegroundColor Yellow
Write-Host ""

# Step 1: Upload all necessary files
Write-Host "[1/5] Uploading files..." -ForegroundColor Cyan

scp "next.config.js" "${vpsUser}@${vpsIp}:${vpsPath}/next.config.js"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ next.config.js uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload next.config.js" -ForegroundColor Red
    exit 1
}

scp "src/app/api/blog/rss/route.ts" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/api/blog/rss/route.ts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ api/blog/rss/route.ts uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload api/blog/rss/route.ts" -ForegroundColor Red
    exit 1
}

scp "src/app/feed.xml/route.ts" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/feed.xml/route.ts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ feed.xml/route.ts uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload feed.xml/route.ts" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Test API endpoint first
Write-Host "[2/5] Testing API endpoint..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/api/blog/rss 2>&1 | head -3"
Write-Host ""

# Step 3: Rebuild Next.js (this is critical for rewrites!)
Write-Host "[3/5] Rebuilding Next.js..." -ForegroundColor Cyan
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Build completed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Build failed" -ForegroundColor Red
    Write-Host "  Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Restart PM2
Write-Host "[4/5] Restarting PM2..." -ForegroundColor Cyan
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

# Step 5: Test RSS feed
Write-Host "[5/5] Testing RSS feed..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing /api/blog/rss..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/api/blog/rss 2>&1 | head -3"

Write-Host ""
Write-Host "Testing /feed.xml..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/feed.xml 2>&1 | head -3"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ REBUILD COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test in browser: https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host "  2. Should see XML content, not 404" -ForegroundColor White
Write-Host "  3. Add to IFTTT: https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host ""

