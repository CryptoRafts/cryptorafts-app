# ============================================
# FIX ALL ISSUES - Complete PowerShell Script
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔧 FIXING ALL ISSUES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_USER = "root"
$VPS_IP = "72.61.98.99"
$VPS_PATH = "/var/www/cryptorafts"

# Step 1: Check if files exist
Write-Host "[1/5] Checking required files..." -ForegroundColor Yellow

$filesToCheck = @(
    "public/favicon.ico",
    "public/tablogo.ico",
    "public/site.webmanifest",
    "server.js",
    "next.config.js"
)

$missingFiles = @()
foreach ($file in $filesToCheck) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "  ❌ Missing: $file" -ForegroundColor Red
    } else {
        Write-Host "  ✅ Found: $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Missing files detected!" -ForegroundColor Yellow
    Write-Host "Please create missing files before continuing." -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Upload updated server.js
Write-Host "[2/5] Uploading server.js..." -ForegroundColor Yellow
if (Test-Path "server.js") {
    scp server.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ server.js uploaded!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to upload server.js" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  server.js not found, skipping..." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Upload updated next.config.js
Write-Host "[3/5] Uploading next.config.js..." -ForegroundColor Yellow
if (Test-Path "next.config.js") {
    scp next.config.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ next.config.js uploaded!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to upload next.config.js" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  next.config.js not found, skipping..." -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Upload static files
Write-Host "[4/5] Uploading static files..." -ForegroundColor Yellow

if (Test-Path "public/favicon.ico") {
    scp public/favicon.ico ${VPS_USER}@${VPS_IP}:${VPS_PATH}/public/
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ favicon.ico uploaded!" -ForegroundColor Green
    }
}

if (Test-Path "public/tablogo.ico") {
    scp public/tablogo.ico ${VPS_USER}@${VPS_IP}:${VPS_PATH}/public/
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ tablogo.ico uploaded!" -ForegroundColor Green
    }
}

if (Test-Path "public/site.webmanifest") {
    scp public/site.webmanifest ${VPS_USER}@${VPS_IP}:${VPS_PATH}/public/
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ site.webmanifest uploaded!" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️  site.webmanifest not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Provide VPS commands
Write-Host "[5/5] VPS Commands to Run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "SSH into VPS and run:" -ForegroundColor Cyan
Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host ""
Write-Host "cd ${VPS_PATH}" -ForegroundColor White
Write-Host "rm -rf .next/cache" -ForegroundColor White
Write-Host "pm2 restart cryptorafts" -ForegroundColor White
Write-Host ""
Write-Host "Test static files:" -ForegroundColor Yellow
Write-Host "curl -I http://localhost:3000/favicon.ico" -ForegroundColor White
Write-Host "curl -I http://localhost:3000/tablogo.ico" -ForegroundColor White
Write-Host "curl -I http://localhost:3000/site.webmanifest" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ UPLOAD COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Fix Firebase CORS Issue" -ForegroundColor Yellow
Write-Host ""
Write-Host "The Firebase CORS errors need to be fixed in Firebase Console:" -ForegroundColor Yellow
Write-Host "1. Go to Firebase Console: https://console.firebase.google.com" -ForegroundColor White
Write-Host "2. Select project: cryptorafts-b9067" -ForegroundColor White
Write-Host "3. Go to Authentication > Settings > Authorized domains" -ForegroundColor White
Write-Host "4. Add: www.cryptorafts.com" -ForegroundColor White
Write-Host "5. Add: cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "This will fix the CORS errors!" -ForegroundColor Green
Write-Host ""

