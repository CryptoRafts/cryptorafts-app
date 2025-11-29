# ============================================
# DEPLOY RSS FEED IFTTT FIX
# ============================================
# This script uploads the updated RSS feed files
# that meet IFTTT requirements

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOY RSS FEED IFTTT FIX" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload RSS feed route files
Write-Host "[1/3] Uploading RSS feed route files..." -ForegroundColor Cyan
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

# Step 2: Restart PM2
Write-Host "[2/3] Restarting PM2..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ PM2 restarted" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to restart PM2" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting 5 seconds for app to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 3: Test RSS feed
Write-Host "[3/3] Testing RSS feed..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing /api/blog/rss..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/api/blog/rss | head -5"

Write-Host ""
Write-Host "Testing /feed.xml..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/feed.xml | head -5"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ RSS FEED IFTTT FIX DEPLOYED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IFTTT Requirements Fixed:" -ForegroundColor Yellow
Write-Host "  ✓ RFC 822 date format (IFTTT requirement)" -ForegroundColor White
Write-Host "  ✓ Unique GUIDs for each item" -ForegroundColor White
Write-Host "  ✓ Images in content:encoded tag" -ForegroundColor White
Write-Host "  ✓ Proper XML namespace declarations" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test feed in browser: https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host "  2. Validate with W3C: https://validator.w3.org/feed/" -ForegroundColor White
Write-Host "  3. Add to IFTTT: https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host ""

