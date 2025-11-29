# ============================================
# DEPLOY LOADING FIX TO VPS
# Fixes stuck loading states
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING LOADING FIX" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed SpotlightDisplay component
Write-Host "[1/4] Uploading fixed SpotlightDisplay component..." -ForegroundColor Cyan
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

# Step 2: Clean and rebuild
Write-Host "[2/4] Cleaning build artifacts..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; rm -rf .next; rm -rf node_modules/.cache"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build artifacts cleaned" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Clean failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Build application
Write-Host "[3/4] Building application..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build complete" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Restart PM2
Write-Host "[4/4] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] PM2 restarted" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Restart failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] LOADING FIX DEPLOYED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "  [OK] Added timeout to Firestore queries (5 seconds)" -ForegroundColor White
Write-Host "  [OK] Added query timeout (3 seconds)" -ForegroundColor White
Write-Host "  [OK] Ensured loading state always completes" -ForegroundColor White
Write-Host "  [OK] Better error handling" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "The 'Loading spotlights...' should now complete quickly!" -ForegroundColor Green
Write-Host ""

