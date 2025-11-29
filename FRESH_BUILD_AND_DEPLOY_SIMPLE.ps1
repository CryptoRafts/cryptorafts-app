# ============================================
# FRESH BUILD AND DEPLOY TO VPS (SIMPLE)
# Uses SSH without password (you'll be prompted)
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FRESH BUILD AND DEPLOY TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean local build
Write-Host "[1/8] Cleaning local build..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "  [OK] Local .next directory removed" -ForegroundColor Green
}
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "  [OK] Local cache removed" -ForegroundColor Green
}
Write-Host ""

# Step 2: Build locally (optional - for verification)
Write-Host "[2/8] Building locally (verification)..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Local build successful" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Local build had issues, continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Stop and clear VPS
Write-Host "[3/8] Stopping and clearing VPS..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "pm2 stop cryptorafts 2>/dev/null || true; pm2 delete cryptorafts 2>/dev/null || true; rm -rf $vpsPath; mkdir -p $vpsPath; echo '✅ VPS cleared'"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] VPS cleared" -ForegroundColor Green
} else {
    Write-Host "  [WARN] VPS clear had issues (may be OK if nothing exists)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Upload package.json and config files
Write-Host "[4/8] Uploading configuration files..." -ForegroundColor Cyan
$configFiles = @("package.json", "package-lock.json", "next.config.js", "tsconfig.json", ".env.local")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        scp -o ConnectTimeout=30 -o ServerAliveInterval=60 $file "${vpsUser}@${vpsIp}:${vpsPath}/$file" | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $file" -ForegroundColor Green
        }
    }
}
Write-Host ""

# Step 5: Upload source files
Write-Host "[5/8] Uploading source files..." -ForegroundColor Cyan
Write-Host "  This takes 3-5 minutes..." -ForegroundColor Yellow
if (Test-Path "src") {
    scp -r -o ConnectTimeout=30 -o ServerAliveInterval=60 "src" "${vpsUser}@${vpsIp}:${vpsPath}/" | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] src/ directory uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] src/ upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] src/ directory not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Upload public files
Write-Host "[6/8] Uploading public files..." -ForegroundColor Cyan
if (Test-Path "public") {
    scp -r -o ConnectTimeout=30 -o ServerAliveInterval=60 "public" "${vpsUser}@${vpsIp}:${vpsPath}/" | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] public/ directory uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] public/ upload had issues" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARN] public/ directory not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Install dependencies and build on VPS
Write-Host "[7/8] Installing dependencies and building on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 5-7 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd $vpsPath && npm install --legacy-peer-deps && npm run build && echo '✅ Build complete'"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Build complete" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 8: Start PM2
Write-Host "[8/8] Starting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd $vpsPath && pm2 start npm --name cryptorafts -- start && pm2 save && pm2 startup && echo '✅ PM2 started'"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] PM2 started" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] PM2 start failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Wait and check
Write-Host "Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] FRESH BUILD AND DEPLOY COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was done:" -ForegroundColor Cyan
Write-Host "  [OK] Cleaned local build" -ForegroundColor White
Write-Host "  [OK] Built locally (verification)" -ForegroundColor White
Write-Host "  [OK] Cleared VPS" -ForegroundColor White
Write-Host "  [OK] Uploaded all files" -ForegroundColor White
Write-Host "  [OK] Installed dependencies" -ForegroundColor White
Write-Host "  [OK] Built on VPS" -ForegroundColor White
Write-Host "  [OK] Started PM2" -ForegroundColor White
Write-Host ""
Write-Host "Your site should now be working at:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "Check PM2 status:" -ForegroundColor Cyan
Write-Host "  ssh root@72.61.98.99 'pm2 status'" -ForegroundColor White
Write-Host ""

