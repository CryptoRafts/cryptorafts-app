# ============================================
# UPLOAD COMPLETE APP TO VPS
# Uploads entire application for fresh install
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UPLOADING COMPLETE APP TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will upload your entire application" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create directory on VPS
Write-Host "[1/6] Creating directory on VPS..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "mkdir -p ${vpsPath}"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Directory created" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Failed to create directory" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Upload package.json and config files
Write-Host "[2/6] Uploading configuration files..." -ForegroundColor Cyan
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

# Step 3: Upload source files
Write-Host "[3/6] Uploading source files..." -ForegroundColor Cyan
Write-Host "  This may take a few minutes..." -ForegroundColor Yellow
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

# Step 4: Upload public files
Write-Host "[4/6] Uploading public files..." -ForegroundColor Cyan
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

# Step 5: Upload other important files
Write-Host "[5/6] Uploading other files..." -ForegroundColor Cyan
$otherFiles = @(".gitignore", "README.md")
foreach ($file in $otherFiles) {
    if (Test-Path $file) {
        scp -o ConnectTimeout=30 -o ServerAliveInterval=60 $file "${vpsUser}@${vpsIp}:${vpsPath}/$file" | Out-Null
    }
}
Write-Host "  [OK] Other files uploaded" -ForegroundColor Green
Write-Host ""

# Step 6: Verify upload
Write-Host "[6/6] Verifying upload..." -ForegroundColor Cyan
$checkResult = ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; if [ -f package.json ] && [ -d src ]; then echo 'OK'; else echo 'FAIL'; fi"
if ($checkResult -eq "OK") {
    Write-Host "  [OK] Upload verified" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Upload verification failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] UPLOAD COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now run on VPS:" -ForegroundColor Cyan
Write-Host "  ssh root@72.61.98.99" -ForegroundColor White
Write-Host "  chmod +x /root/FRESH_VPS_SETUP.sh" -ForegroundColor White
Write-Host "  /root/FRESH_VPS_SETUP.sh" -ForegroundColor White
Write-Host ""
Write-Host "Or run the setup script directly:" -ForegroundColor Cyan
Write-Host "  ssh root@72.61.98.99 'bash -s' < FRESH_VPS_SETUP.sh" -ForegroundColor White
Write-Host ""

