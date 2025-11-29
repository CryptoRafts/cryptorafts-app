# ============================================
# FRESH BUILD AND DEPLOY - AUTO VERSION
# ============================================
# Run with password: .\FRESH_BUILD_DEPLOY_AUTO.ps1 -VPS_PASSWORD "your_password"

param(
    [Parameter(Mandatory=$true)]
    [string]$VPS_PASSWORD
)

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"
$LOCAL_DIR = (Get-Location).Path

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  FRESH BUILD AND DEPLOY - AUTO" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean
Write-Host "[1/7] Cleaning..." -ForegroundColor Cyan
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Verify
Write-Host "[2/7] Verifying source..." -ForegroundColor Cyan
if (-not (Test-Path "src/app/page.tsx")) {
    Write-Host "❌ src/app/page.tsx NOT FOUND!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Source verified" -ForegroundColor Green
Write-Host ""

# Step 3: Build
Write-Host "[3/7] Building..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 2-3 minutes..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
npm run build 2>&1 | Out-Null
if (-not (Test-Path ".next")) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Step 4: Upload
Write-Host "[4/7] Uploading files..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 3-5 minutes..." -ForegroundColor Yellow
$env:SSHPASS = $VPS_PASSWORD
$projectPath = $LOCAL_DIR -replace "C:", "/mnt/c" -replace "\\", "/"
$uploadCmd = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -r -o StrictHostKeyChecking=no . ${VPS_USER}@${VPS_IP}:~/cryptorafts/"
wsl bash -c $uploadCmd 2>&1 | Out-Null
Write-Host "✅ Files uploaded!" -ForegroundColor Green
Write-Host ""

# Step 5: Upload script
Write-Host "[5/7] Uploading deployment script..." -ForegroundColor Cyan
if (Test-Path "FIX_EVERYTHING_VPS.sh") {
    $scriptUpload = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -o StrictHostKeyChecking=no FIX_EVERYTHING_VPS.sh ${VPS_USER}@${VPS_IP}:~/FIX_EVERYTHING_VPS.sh"
    wsl bash -c $scriptUpload 2>&1 | Out-Null
}
Write-Host "✅ Script uploaded!" -ForegroundColor Green
Write-Host ""

# Step 6: Deploy
Write-Host "[6/7] Deploying on VPS..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 5-10 minutes..." -ForegroundColor Yellow
$deployCmd = "cd ~/cryptorafts; chmod +x ~/FIX_EVERYTHING_VPS.sh; bash ~/FIX_EVERYTHING_VPS.sh"
$sshCmd = "sshpass -e ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} '$deployCmd'"
wsl bash -c $sshCmd 2>&1 | Tee-Object
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""

# Step 7: Done
Write-Host "[7/7] ✅ COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Your website is LIVE at:" -ForegroundColor Cyan
Write-Host "   https://www.cryptorafts.com" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Clear browser cache: Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "   2. Hard refresh: Ctrl+F5" -ForegroundColor White
Write-Host "   3. Visit: https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""

