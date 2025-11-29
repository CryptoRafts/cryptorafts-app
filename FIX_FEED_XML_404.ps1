# ============================================
# FIX FEED.XML 404 ERROR
# ============================================
# This script uploads all necessary files to fix the 404 error

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIX FEED.XML 404 ERROR" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload next.config.js (with rewrites)
Write-Host "[1/4] Uploading next.config.js..." -ForegroundColor Cyan
scp "next.config.js" "${vpsUser}@${vpsIp}:${vpsPath}/next.config.js"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ next.config.js uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload next.config.js" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Upload RSS feed route files
Write-Host "[2/4] Uploading RSS feed route files..." -ForegroundColor Cyan

# Create directories if they don't exist
ssh "${vpsUser}@${vpsIp}" "mkdir -p ${vpsPath}/src/app/api/blog/rss ${vpsPath}/src/app/feed.xml"

# Upload API route
scp "src/app/api/blog/rss/route.ts" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/api/blog/rss/route.ts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ api/blog/rss/route.ts uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload api/blog/rss/route.ts" -ForegroundColor Red
    exit 1
}

# Upload feed.xml route
scp "src/app/feed.xml/route.ts" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/feed.xml/route.ts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ feed.xml/route.ts uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload feed.xml/route.ts" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Restart PM2 (this will trigger Next.js rebuild)
Write-Host "[3/4] Restarting PM2..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ PM2 restarted" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to restart PM2" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting 10 seconds for app to rebuild and start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Test RSS feed
Write-Host "[4/4] Testing RSS feed..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing /api/blog/rss..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/api/blog/rss 2>&1 | head -5"

Write-Host ""
Write-Host "Testing /feed.xml..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/feed.xml 2>&1 | head -5"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ FEED.XML 404 FIX DEPLOYED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test in browser: https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host "  2. Should see XML content, not 404" -ForegroundColor White
Write-Host "  3. Add to IFTTT: https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host ""
Write-Host "Note: The other errors (analytics.js, favicon.ico) are not related" -ForegroundColor Yellow
Write-Host "to the RSS feed and won't affect IFTTT." -ForegroundColor Yellow
Write-Host ""

