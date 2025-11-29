# ============================================
# QUICK FIX ALL ISSUES - PowerShell Script
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "QUICK FIX ALL ISSUES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_USER = "root"
$VPS_IP = "72.61.98.99"
$VPS_PATH = "/var/www/cryptorafts"

# Step 1: Upload server.js
Write-Host "[1/4] Uploading server.js..." -ForegroundColor Yellow
if (Test-Path "server.js") {
    scp server.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
    Write-Host "  server.js uploaded" -ForegroundColor Green
} else {
    Write-Host "  server.js not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Upload next.config.js
Write-Host "[2/4] Uploading next.config.js..." -ForegroundColor Yellow
if (Test-Path "next.config.js") {
    scp next.config.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
    Write-Host "  next.config.js uploaded" -ForegroundColor Green
} else {
    Write-Host "  next.config.js not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Upload static files
Write-Host "[3/4] Uploading static files..." -ForegroundColor Yellow

if (Test-Path "public/site.webmanifest") {
    scp public/site.webmanifest ${VPS_USER}@${VPS_IP}:${VPS_PATH}/public/
    Write-Host "  site.webmanifest uploaded" -ForegroundColor Green
}

if (Test-Path "public/favicon.ico") {
    scp public/favicon.ico ${VPS_USER}@${VPS_IP}:${VPS_PATH}/public/
    Write-Host "  favicon.ico uploaded" -ForegroundColor Green
}

if (Test-Path "public/tablogo.ico") {
    scp public/tablogo.ico ${VPS_USER}@${VPS_IP}:${VPS_PATH}/public/
    Write-Host "  tablogo.ico uploaded" -ForegroundColor Green
}
Write-Host ""

# Step 4: Upload src folder (for spotlight route)
Write-Host "[4/4] Uploading src folder (for spotlight route)..." -ForegroundColor Yellow
if (Test-Path "src") {
    scp -r src ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
    Write-Host "  src folder uploaded" -ForegroundColor Green
} else {
    Write-Host "  src folder not found" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UPLOAD COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOW RUN ON VPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "cd ${VPS_PATH}" -ForegroundColor White
Write-Host "rm -rf .next/cache" -ForegroundColor White
Write-Host "pm2 restart cryptorafts" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test files:" -ForegroundColor Yellow
Write-Host "curl -I http://localhost:3000/site.webmanifest" -ForegroundColor White
Write-Host "curl -I http://localhost:3000/favicon.ico" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CRITICAL: Fix Firebase CORS" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The CORS errors are from Firebase, not your app" -ForegroundColor Yellow
Write-Host ""
Write-Host "Fix in Firebase Console:" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.firebase.google.com" -ForegroundColor White
Write-Host "2. Select project: cryptorafts-b9067" -ForegroundColor White
Write-Host "3. Go to: Authentication - Settings - Authorized domains" -ForegroundColor White
Write-Host "4. Add: www.cryptorafts.com" -ForegroundColor Cyan
Write-Host "5. Add: cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will fix ALL CORS errors" -ForegroundColor Green
Write-Host ""
