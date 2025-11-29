# ============================================
# QUICK DEPLOY - ALL FIXES
# Single command to deploy everything
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING COMPLETE BUILD TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Upload all critical files
Write-Host "[1/3] Uploading files..." -ForegroundColor Cyan

$files = @(
    @{Local="src/app/page.tsx"; Remote="src/app/page.tsx"},
    @{Local="src/app/globals.css"; Remote="src/app/globals.css"},
    @{Local="src/app/loading.tsx"; Remote="src/app/loading.tsx"},
    @{Local="src/components/LoadingOptimizer.tsx"; Remote="src/components/LoadingOptimizer.tsx"},
    @{Local="src/app/admin/blog/page.tsx"; Remote="src/app/admin/blog/page.tsx"},
    @{Local="src/app/admin/blog/new/page.tsx"; Remote="src/app/admin/blog/new/page.tsx"},
    @{Local="src/app/api/blog/rss/route.ts"; Remote="src/app/api/blog/rss/route.ts"},
    @{Local="src/app/feed.xml/route.ts"; Remote="src/app/feed.xml/route.ts"},
    @{Local="next.config.js"; Remote="next.config.js"},
    @{Local="server.js"; Remote="server.js"},
    @{Local="ecosystem.config.js"; Remote="ecosystem.config.js"},
    @{Local="src/middleware.ts"; Remote="src/middleware.ts"}
)

$uploaded = 0
$failed = 0

foreach ($file in $files) {
    if (Test-Path $file.Local) {
        scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "$($file.Local)" "${vpsUser}@${vpsIp}:${vpsPath}/$($file.Remote)" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $($file.Local)" -ForegroundColor Green
            $uploaded++
        } else {
            Write-Host "  [FAIL] $($file.Local)" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "  [SKIP] $($file.Local) (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  Uploaded: $uploaded, Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

# Build on VPS
Write-Host "[2/3] Building on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm install --legacy-peer-deps 2>&1 | tail -5; npm run build 2>&1 | tail -10"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    Write-Host "  Run manually: ssh root@72.61.98.99 'cd /var/www/cryptorafts; npm run build'" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] Build complete" -ForegroundColor Green
Write-Host ""

# Restart PM2
Write-Host "[3/3] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts; pm2 status"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Restart failed" -ForegroundColor Red
    Write-Host "  Run manually: ssh root@72.61.98.99 'cd /var/www/cryptorafts; pm2 restart cryptorafts'" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] PM2 restarted" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host "  https://www.cryptorafts.com/blog" -ForegroundColor White
Write-Host "  https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host ""













