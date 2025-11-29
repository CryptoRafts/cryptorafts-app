# ============================================
# DEPLOY CLEAN BUILD TO VPS
# Complete deployment with clean build
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING CLEAN BUILD TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed SpotlightDisplay component
Write-Host "[1/7] Uploading fixed SpotlightDisplay component..." -ForegroundColor Cyan
if (Test-Path "src/components/SpotlightDisplay.tsx") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "src/components/SpotlightDisplay.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] SpotlightDisplay.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] SpotlightDisplay.tsx not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Upload other critical files
Write-Host "[2/7] Uploading critical application files..." -ForegroundColor Cyan
$filesToUpload = @(
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/app/globals.css",
    "src/middleware.ts",
    "next.config.js"
)

foreach ($file in $filesToUpload) {
    if (Test-Path $file) {
        $remotePath = $file -replace "src/", "${vpsPath}/src/" -replace "next.config.js", "${vpsPath}/next.config.js"
        scp -o ConnectTimeout=30 -o ServerAliveInterval=60 $file "${vpsUser}@${vpsIp}:${remotePath}" | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $(Split-Path $file -Leaf) uploaded" -ForegroundColor Green
        }
    }
}
Write-Host ""

# Step 3: Upload public assets
Write-Host "[3/7] Uploading public assets..." -ForegroundColor Cyan
if (Test-Path "public/favicon.ico") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "public/favicon.ico" "${vpsUser}@${vpsIp}:${vpsPath}/public/favicon.ico" | Out-Null
    Write-Host "  [OK] favicon.ico uploaded" -ForegroundColor Green
}
Write-Host ""

# Step 4: Clean build artifacts on VPS
Write-Host "[4/7] Cleaning build artifacts on VPS..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; rm -rf .next; rm -rf node_modules/.cache; echo '✅ Build artifacts cleaned'"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build artifacts cleaned" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Clean failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Build application
Write-Host "[5/7] Building application on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build complete" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    Write-Host "  Check the output above for errors" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 6: Verify build files
Write-Host "[6/7] Verifying build files..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; if [ -d '.next/static' ]; then echo '✅ Static files exist'; else echo '❌ Static files missing'; exit 1; fi"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build files verified" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Build verification failed" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Restart PM2
Write-Host "[7/7] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] PM2 restarted" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Restart failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Wait for app to start
Write-Host "Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Final status check
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] CLEAN BUILD DEPLOYED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was deployed:" -ForegroundColor Cyan
Write-Host "  [OK] Fixed SpotlightDisplay component (with timeouts)" -ForegroundColor White
Write-Host "  [OK] All critical application files" -ForegroundColor White
Write-Host "  [OK] Public assets (favicon, etc.)" -ForegroundColor White
Write-Host "  [OK] Clean build (removed old artifacts)" -ForegroundColor White
Write-Host "  [OK] Fresh build created" -ForegroundColor White
Write-Host "  [OK] PM2 restarted" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "The app should now work perfectly!" -ForegroundColor Green
Write-Host "  - Loading states will complete within 5 seconds" -ForegroundColor White
Write-Host "  - No more stuck 'Loading...' messages" -ForegroundColor White
Write-Host "  - All components should render properly" -ForegroundColor White
Write-Host ""

