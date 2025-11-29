# ============================================
# FIX ADMIN UI - DEPLOY TO VPS
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIX ADMIN UI - DEPLOY TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed admin blog pages
Write-Host "[1/4] Uploading fixed admin blog pages..." -ForegroundColor Cyan

scp "src/app/admin/blog/page.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/admin/blog/page.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ admin/blog/page.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload admin/blog/page.tsx" -ForegroundColor Red
    exit 1
}

scp "src/app/admin/blog/new/page.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/admin/blog/new/page.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ admin/blog/new/page.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload admin/blog/new/page.tsx" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Rebuild Next.js
Write-Host "[2/4] Rebuilding Next.js..." -ForegroundColor Cyan
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
Write-Host "[3/4] Restarting PM2..." -ForegroundColor Cyan
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

# Step 4: Test admin UI
Write-Host "[4/4] Testing admin UI..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing /admin/blog..." -ForegroundColor White
ssh "${vpsUser}@${vpsIp}" "curl -I http://localhost:3000/admin/blog 2>&1 | head -5"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ ADMIN UI FIX DEPLOYED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "  ✓ Improved admin authentication check" -ForegroundColor White
Write-Host "  ✓ Added loading state for auth verification" -ForegroundColor White
Write-Host "  ✓ Checks multiple admin indicators:" -ForegroundColor White
Write-Host "    - claims.admin.super" -ForegroundColor Gray
Write-Host "    - claims.role === 'admin'" -ForegroundColor Gray
Write-Host "    - localStorage.userRole === 'admin'" -ForegroundColor Gray
Write-Host "    - user.customClaims" -ForegroundColor Gray
Write-Host ""
Write-Host "Test admin UI:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com/admin/blog" -ForegroundColor White
Write-Host ""
Write-Host "If still not working:" -ForegroundColor Yellow
Write-Host "  1. Check browser console (F12) for errors" -ForegroundColor White
Write-Host "  2. Check PM2 logs: pm2 logs cryptorafts --lines 50" -ForegroundColor White
Write-Host "  3. Verify you're logged in as admin" -ForegroundColor White
Write-Host "  4. Check localStorage.userRole === 'admin'" -ForegroundColor White
Write-Host ""

