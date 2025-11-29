# ============================================
# CRYPTORAFTS - DEPLOYMENT USING SCP
# ============================================
# This uploads the file first, then executes it
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"
$scriptFile = "RUN_THIS_IN_SSH_NOW.sh"

Write-Host ""
Write-Host "CRYPTORAFTS - COMPLETE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if deployment script exists
Write-Host "Step 1: Checking deployment files..." -ForegroundColor Yellow
if (-not (Test-Path $scriptFile)) {
    Write-Host "ERROR: $scriptFile not found!" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    exit 1
}
Write-Host "SUCCESS: $scriptFile found" -ForegroundColor Green
Write-Host ""

# Step 2: Check SSH and SCP
Write-Host "Step 2: Checking SSH/SCP availability..." -ForegroundColor Yellow
$sshPath = Get-Command ssh -ErrorAction SilentlyContinue
$scpPath = Get-Command scp -ErrorAction SilentlyContinue

if (-not $sshPath) {
    Write-Host "ERROR: SSH not found!" -ForegroundColor Red
    exit 1
}
if (-not $scpPath) {
    Write-Host "ERROR: SCP not found!" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: SSH and SCP found" -ForegroundColor Green
Write-Host ""

# Step 3: Upload file to VPS
Write-Host "Step 3: Uploading deployment script to VPS..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan

# Create directory on remote server first
ssh "$vpsUser@$vpsIP" "mkdir -p $appDir" 2>&1 | Out-Null

# Upload the file
$uploadResult = scp $scriptFile "${vpsUser}@${vpsIP}:${appDir}/" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: File upload failed!" -ForegroundColor Red
    Write-Host $uploadResult -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: File uploaded to $appDir/$scriptFile" -ForegroundColor Green
Write-Host ""

# Step 4: Execute deployment
Write-Host "Step 4: Executing deployment on VPS..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes. Please wait..." -ForegroundColor Yellow
Write-Host ""

# Execute the script on remote server
ssh "$vpsUser@$vpsIP" "cd $appDir && chmod +x $scriptFile && bash $scriptFile"

# Step 5: Check results
Write-Host ""
Write-Host "Step 5: Deployment execution completed" -ForegroundColor Yellow

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the SSH output above for any errors." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

