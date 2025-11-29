# ============================================
# UPLOAD AND BUILD - SIMPLE VERSION
# Uploads files and builds on VPS
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UPLOAD AND BUILD" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload config files
Write-Host "[1/4] Uploading config files..." -ForegroundColor Cyan
$configFiles = @("package.json", "package-lock.json", "next.config.js", "tsconfig.json", ".env.local")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "  Uploading $file..." -ForegroundColor White
        scp $file "${vpsUser}@${vpsIp}:${vpsPath}/$file"
    }
}
Write-Host ""

# Step 2: Upload src directory
Write-Host "[2/4] Uploading src directory..." -ForegroundColor Cyan
Write-Host "  This takes 3-5 minutes..." -ForegroundColor Yellow
if (Test-Path "src") {
    scp -r src "${vpsUser}@${vpsIp}:${vpsPath}/"
    Write-Host "  [OK] src/ uploaded" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] src/ not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Upload public directory
Write-Host "[3/4] Uploading public directory..." -ForegroundColor Cyan
if (Test-Path "public") {
    scp -r public "${vpsUser}@${vpsIp}:${vpsPath}/"
    Write-Host "  [OK] public/ uploaded" -ForegroundColor Green
} else {
    Write-Host "  [WARN] public/ not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Build on VPS
Write-Host "[4/4] Building on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 5-7 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm install --legacy-peer-deps && npm run build && pm2 restart cryptorafts || pm2 start npm --name cryptorafts -- start && pm2 save"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] UPLOAD AND BUILD COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your site should now be working at:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""

