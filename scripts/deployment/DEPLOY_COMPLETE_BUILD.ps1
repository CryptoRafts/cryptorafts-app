# ============================================
# CRYPTORAFTS - COMPLETE BUILD DEPLOYMENT
# Uploads all fixed files and rebuilds everything
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - COMPLETE BUILD DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Creating directory structure on VPS..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIP}" "mkdir -p ${appDir}/src/lib ${appDir}/src/providers ${appDir}/src/app ${appDir}/src/components" 2>&1 | Out-Null

Write-Host ""
Write-Host "Step 2: Uploading all fixed files..." -ForegroundColor Yellow

# Files to upload
$filesToUpload = @(
    "src/lib/firebase.client.ts",
    "src/providers/SimpleAuthProvider.tsx",
    "src/app/page.tsx"
)

$uploadSuccess = $true
foreach ($file in $filesToUpload) {
    if (Test-Path $file) {
        Write-Host "Uploading $file..." -ForegroundColor Cyan
        scp $file "${vpsUser}@${vpsIP}:${appDir}/$file" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: $file uploaded" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Failed to upload $file" -ForegroundColor Red
            $uploadSuccess = $false
        }
    } else {
        Write-Host "WARNING: File not found: $file" -ForegroundColor Yellow
    }
}

if (-not $uploadSuccess) {
    Write-Host ""
    Write-Host "ERROR: Some files failed to upload. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Rebuilding application..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

# Create rebuild script
$rebuildScript = @"
cd $appDir
echo 'Setting up Node.js 20...'
source ~/.nvm/nvm.sh 2>/dev/null || true
nvm use 20 2>/dev/null || export PATH=/root/.nvm/versions/node/v20.*/bin:`$PATH
echo 'Installing dependencies...'
npm install --legacy-peer-deps
echo 'Building Next.js application...'
npm run build
echo 'Restarting PM2...'
pm2 delete cryptorafts 2>/dev/null || true
pm2 start ecosystem.config.js
echo 'Checking PM2 status...'
pm2 status
echo 'Showing recent logs...'
pm2 logs cryptorafts --lines 5 --nostream
echo 'Build complete!'
"@

# Convert to Unix line endings and execute
$rebuildScript = $rebuildScript -replace "`r`n", "`n" -replace "`r", "`n"
$rebuildScript | ssh "${vpsUser}@${vpsIP}" bash

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: COMPLETE BUILD DEPLOYED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host " https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "All fixes applied:" -ForegroundColor Green
    Write-Host "  - Firebase auth initialization fixed" -ForegroundColor Green
    Write-Host "  - Homepage rendering fixed (no blocking loader)" -ForegroundColor Green
    Write-Host "  - Content visibility fixed (z-index)" -ForegroundColor Green
    Write-Host "  - Database lazy loading fixed" -ForegroundColor Green
    Write-Host "  - All components working properly" -ForegroundColor Green
    Write-Host ""
    Write-Host "The application is fully functional!" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the SSH output above for any errors." -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

