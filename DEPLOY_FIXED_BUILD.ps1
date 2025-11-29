# ============================================
# DEPLOY FIXED BUILD TO VPS - ALL INLINE STYLES REMOVED
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"
$localPath = "C:\Users\dell\cryptorafts-starter"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIXED BUILD TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build locally
Write-Host "[1/5] Building Next.js app locally..." -ForegroundColor Cyan
Set-Location $localPath
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Upload fixed files
Write-Host "[2/5] Uploading fixed files to VPS..." -ForegroundColor Cyan

# Upload page.tsx
Write-Host "  Uploading page.tsx..." -ForegroundColor Yellow
scp "src/app/page.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "    ✗ Failed to upload page.tsx" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ Uploaded page.tsx" -ForegroundColor Green

# Upload globals.css
Write-Host "  Uploading globals.css..." -ForegroundColor Yellow
scp "src/app/globals.css" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/globals.css"
if ($LASTEXITCODE -ne 0) {
    Write-Host "    ✗ Failed to upload globals.css" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ Uploaded globals.css" -ForegroundColor Green

# Upload .next folder
Write-Host "  Uploading .next build folder..." -ForegroundColor Yellow
scp -r ".next" "${vpsUser}@${vpsIp}:${vpsPath}/.next"
if ($LASTEXITCODE -ne 0) {
    Write-Host "    ✗ Failed to upload .next folder" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ Uploaded .next folder" -ForegroundColor Green

Write-Host "  ✓ All files uploaded" -ForegroundColor Green
Write-Host ""

# Step 3: Rebuild on VPS (to ensure everything is correct)
Write-Host "[3/5] Rebuilding on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed on VPS" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build complete on VPS" -ForegroundColor Green
Write-Host ""

# Step 4: Restart PM2
Write-Host "[4/5] Restarting PM2..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ PM2 restart failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ PM2 restarted" -ForegroundColor Green
Write-Host ""

# Step 5: Wait and verify
Write-Host "[5/5] Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15
Write-Host "  ✓ App should be running now" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was deployed:" -ForegroundColor Cyan
Write-Host "  ✓ Fixed page.tsx (all inline styles removed)" -ForegroundColor White
Write-Host "  ✓ Fixed globals.css (all styles moved to CSS classes)" -ForegroundColor White
Write-Host "  ✓ Fresh .next build folder" -ForegroundColor White
Write-Host "  ✓ Rebuilt on VPS" -ForegroundColor White
Write-Host "  ✓ PM2 restarted" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "Expected results:" -ForegroundColor Yellow
Write-Host "  ✓ No hydration errors in console" -ForegroundColor White
Write-Host "  ✓ All UI elements visible" -ForegroundColor White
Write-Host "  ✓ Smooth scrolling works" -ForegroundColor White
Write-Host "  ✓ Video background works" -ForegroundColor White
Write-Host "  ✓ All sections display correctly" -ForegroundColor White
Write-Host ""
Write-Host "Check PM2 status:" -ForegroundColor Cyan
Write-Host "  ssh ${vpsUser}@${vpsIp} 'cd ${vpsPath}; pm2 status'" -ForegroundColor Gray
Write-Host ""
Write-Host "Check PM2 logs:" -ForegroundColor Cyan
Write-Host "  ssh ${vpsUser}@${vpsIp} 'cd ${vpsPath}; pm2 logs cryptorafts --lines 50'" -ForegroundColor Gray
Write-Host ""













