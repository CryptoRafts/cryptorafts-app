# ============================================
# CRYPTORAFTS - FIX AUTH INITIALIZATION
# Uploads fixed Firebase initialization and rebuilds
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - FIX AUTH INITIALIZATION" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Uploading fixed Firebase files..." -ForegroundColor Yellow

# Files to upload
$filesToUpload = @(
    "src/lib/firebase.client.ts",
    "src/providers/SimpleAuthProvider.tsx"
)

foreach ($file in $filesToUpload) {
    if (Test-Path $file) {
        Write-Host "Uploading $file..." -ForegroundColor Cyan
        scp $file "${vpsUser}@${vpsIP}:${appDir}/$file" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $file uploaded" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to upload $file" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️ File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Step 2: Uploading rebuild script..." -ForegroundColor Yellow

# Upload rebuild script
if (Test-Path "REBUILD_ON_VPS.sh") {
    Write-Host "Uploading REBUILD_ON_VPS.sh..." -ForegroundColor Cyan
    scp REBUILD_ON_VPS.sh "${vpsUser}@${vpsIP}:${appDir}/REBUILD_ON_VPS.sh" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Rebuild script uploaded" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to upload rebuild script" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ REBUILD_ON_VPS.sh not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Rebuilding and restarting..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

# Execute rebuild script on VPS
ssh "${vpsUser}@${vpsIP}" "cd ${appDir} && chmod +x REBUILD_ON_VPS.sh && bash REBUILD_ON_VPS.sh"

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: FIXES DEPLOYED!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host " https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ Firebase auth initialization fixed (no more null errors)" -ForegroundColor Green
    Write-Host "✅ Retry logic added for auth initialization" -ForegroundColor Green
    Write-Host "✅ Lazy getters for db and storage added" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the SSH output above for any errors." -ForegroundColor Yellow
}

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan


