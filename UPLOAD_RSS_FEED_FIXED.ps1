# ============================================
# UPLOAD RSS FEED FILES TO VPS (FIXED)
# ============================================

$VPS_IP = "72.61.98.99"
$VPS_USER = "root"
$VPS_PATH = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UPLOADING RSS FEED FILES TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if files exist
$rssFile1 = "src/app/feed.xml/route.ts"
$rssFile2 = "src/app/api/blog/rss/route.ts"

if (-not (Test-Path $rssFile1)) {
    Write-Host "❌ ERROR: $rssFile1 not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $rssFile2)) {
    Write-Host "❌ ERROR: $rssFile2 not found!" -ForegroundColor Red
    exit 1
}

Write-Host "[Step 1/4] Creating directories on VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "mkdir -p ${VPS_PATH}/src/app/feed.xml ${VPS_PATH}/src/app/api/blog/rss"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create directories" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Directories created" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 2/4] Uploading feed.xml/route.ts..." -ForegroundColor Yellow
scp "$rssFile1" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/app/feed.xml/route.ts"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload feed.xml/route.ts" -ForegroundColor Red
    exit 1
}
Write-Host "✅ feed.xml/route.ts uploaded" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 3/4] Uploading api/blog/rss/route.ts..." -ForegroundColor Yellow
scp "$rssFile2" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/app/api/blog/rss/route.ts"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload api/blog/rss/route.ts" -ForegroundColor Red
    exit 1
}
Write-Host "✅ api/blog/rss/route.ts uploaded" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 4/4] Uploading blog layout..." -ForegroundColor Yellow
$blogLayout = "src/app/blog/layout.tsx"
if (Test-Path $blogLayout) {
    scp "$blogLayout" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/app/blog/layout.tsx"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ blog/layout.tsx uploaded" -ForegroundColor Green
    }
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ RSS FEED FILES UPLOADED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. SSH to VPS: ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "2. Restart app: pm2 restart cryptorafts" -ForegroundColor White
Write-Host "3. Test feed: curl -I http://localhost:3000/feed.xml" -ForegroundColor White
Write-Host ""
Write-Host "Or run these commands on VPS:" -ForegroundColor Yellow
Write-Host "cd /var/www/cryptorafts" -ForegroundColor Cyan
Write-Host "pm2 restart cryptorafts" -ForegroundColor Cyan
Write-Host "curl -I http://localhost:3000/feed.xml" -ForegroundColor Cyan
Write-Host "curl http://localhost:3000/feed.xml | head -20" -ForegroundColor Cyan
Write-Host ""

