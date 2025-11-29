# ============================================
# UPLOAD FILES ONLY - NO BUILD
# Just uploads files, you build on VPS manually
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UPLOAD FILES ONLY" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script ONLY uploads files." -ForegroundColor Yellow
Write-Host "You will build on VPS manually after upload." -ForegroundColor Yellow
Write-Host ""

# Upload config files
Write-Host "Uploading config files..." -ForegroundColor Cyan
$configFiles = @("package.json", "package-lock.json", "next.config.js", "tsconfig.json", ".env.local")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "  Uploading $file..." -ForegroundColor White
        scp -o ConnectTimeout=10 -o ServerAliveInterval=5 $file "${vpsUser}@${vpsIp}:${vpsPath}/$file"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    [OK]" -ForegroundColor Green
        } else {
            Write-Host "    [FAIL] - Run manually: scp $file root@72.61.98.99:/var/www/cryptorafts/" -ForegroundColor Red
        }
    }
}
Write-Host ""

# Upload src directory
Write-Host "Uploading src directory..." -ForegroundColor Cyan
Write-Host "  This takes 3-5 minutes. If it hangs, press Ctrl+C and run manually:" -ForegroundColor Yellow
Write-Host "  scp -r src root@72.61.98.99:/var/www/cryptorafts/" -ForegroundColor White
Write-Host ""
scp -r -o ConnectTimeout=10 -o ServerAliveInterval=5 src "${vpsUser}@${vpsIp}:${vpsPath}/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] src/ uploaded" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] - Run manually: scp -r src root@72.61.98.99:/var/www/cryptorafts/" -ForegroundColor Red
}
Write-Host ""

# Upload public directory
Write-Host "Uploading public directory..." -ForegroundColor Cyan
if (Test-Path "public") {
    scp -r -o ConnectTimeout=10 -o ServerAliveInterval=5 public "${vpsUser}@${vpsIp}:${vpsPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] public/ uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] - Run manually: scp -r public root@72.61.98.99:/var/www/cryptorafts/" -ForegroundColor Red
    }
} else {
    Write-Host "  [SKIP] public/ not found" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] FILES UPLOADED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now run these commands on VPS:" -ForegroundColor Yellow
Write-Host "  ssh root@72.61.98.99" -ForegroundColor White
Write-Host "  cd /var/www/cryptorafts" -ForegroundColor White
Write-Host "  npm install --legacy-peer-deps" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  pm2 restart cryptorafts || pm2 start npm --name cryptorafts -- start" -ForegroundColor White
Write-Host "  pm2 save" -ForegroundColor White
Write-Host ""

