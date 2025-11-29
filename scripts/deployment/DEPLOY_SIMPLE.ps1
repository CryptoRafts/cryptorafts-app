# ============================================
# SIMPLE DEPLOY - NO HANG
# Run commands one at a time
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SIMPLE DEPLOY - NO HANG" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will run commands one at a time." -ForegroundColor Yellow
Write-Host "If it gets stuck, press Ctrl+C and run the commands manually." -ForegroundColor Yellow
Write-Host ""

# Step 1: Clean local
Write-Host "[1/6] Cleaning local build..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  [OK] Cleaned" -ForegroundColor Green
}
Write-Host ""

# Step 2: Upload package.json
Write-Host "[2/6] Uploading package.json..." -ForegroundColor Cyan
Write-Host "  Run this command manually if it hangs:" -ForegroundColor Yellow
Write-Host "  scp package.json root@72.61.98.99:/var/www/cryptorafts/" -ForegroundColor White
$response = Read-Host "Press Enter to continue (or Ctrl+C to skip)"
scp package.json "${vpsUser}@${vpsIp}:${vpsPath}/"
Write-Host ""

# Step 3: Upload other config files
Write-Host "[3/6] Uploading config files..." -ForegroundColor Cyan
$files = @("package-lock.json", "next.config.js", "tsconfig.json", ".env.local")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  Uploading $file..." -ForegroundColor White
        scp $file "${vpsUser}@${vpsIp}:${vpsPath}/"
    }
}
Write-Host ""

# Step 4: Upload src directory
Write-Host "[4/6] Uploading src directory..." -ForegroundColor Cyan
Write-Host "  This takes 3-5 minutes. If it hangs, run manually:" -ForegroundColor Yellow
Write-Host "  scp -r src root@72.61.98.99:/var/www/cryptorafts/" -ForegroundColor White
$response = Read-Host "Press Enter to continue (or Ctrl+C to skip)"
scp -r src "${vpsUser}@${vpsIp}:${vpsPath}/"
Write-Host ""

# Step 5: Upload public directory
Write-Host "[5/6] Uploading public directory..." -ForegroundColor Cyan
if (Test-Path "public") {
    scp -r public "${vpsUser}@${vpsIp}:${vpsPath}/"
}
Write-Host ""

# Step 6: Build on VPS
Write-Host "[6/6] Building on VPS..." -ForegroundColor Cyan
Write-Host "  Run these commands on VPS:" -ForegroundColor Yellow
Write-Host "  ssh root@72.61.98.99" -ForegroundColor White
Write-Host "  cd /var/www/cryptorafts" -ForegroundColor White
Write-Host "  npm install --legacy-peer-deps" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  pm2 start npm --name cryptorafts -- start" -ForegroundColor White
Write-Host "  pm2 save" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] FILES UPLOADED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now run the build commands on VPS manually." -ForegroundColor Yellow
Write-Host ""
