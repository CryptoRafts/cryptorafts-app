# ============================================
# CRYPTORAFTS - COMPLETE DEPLOYMENT SCRIPT
# COPY-PASTE THIS ENTIRE SCRIPT INTO POWERSHELL
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"
$scriptFile = "RUN_THIS_IN_SSH_NOW.sh"

Write-Host ""
Write-Host "CRYPTORAFTS - COMPLETE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to project directory
Write-Host "Step 1: Checking current directory..." -ForegroundColor Yellow
if (-not (Test-Path $scriptFile)) {
    Write-Host "Navigating to project directory..." -ForegroundColor Yellow
    Set-Location "C:\Users\dell\cryptorafts-starter"
    if (-not (Test-Path $scriptFile)) {
        Write-Host "ERROR: $scriptFile not found!" -ForegroundColor Red
        Write-Host "Current directory: $PWD" -ForegroundColor Yellow
        Write-Host "Please run this script from: C:\Users\dell\cryptorafts-starter" -ForegroundColor Yellow
        exit 1
    }
}
Write-Host "SUCCESS: Found in $PWD" -ForegroundColor Green
Write-Host ""

# Step 2: Check SSH and SCP
Write-Host "Step 2: Checking SSH/SCP availability..." -ForegroundColor Yellow
$sshPath = Get-Command ssh -ErrorAction SilentlyContinue
$scpPath = Get-Command scp -ErrorAction SilentlyContinue

if (-not $sshPath) {
    Write-Host "ERROR: SSH not found!" -ForegroundColor Red
    Write-Host "Install OpenSSH: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Cyan
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
Write-Host "You will be prompted for your VPS password (twice)" -ForegroundColor Yellow
Write-Host ""

# Create directory on remote server first
ssh "$vpsUser@$vpsIP" "mkdir -p $appDir" 2>&1 | Out-Null

# Upload the file
Write-Host "Uploading $scriptFile..." -ForegroundColor Yellow
scp $scriptFile "${vpsUser}@${vpsIP}:${appDir}/" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: File upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: File uploaded to $appDir/$scriptFile" -ForegroundColor Green

# Convert line endings on VPS (fix Windows CRLF to Unix LF)
Write-Host "Converting line endings to Unix format..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd $appDir && sed -i 's/\r$//' $scriptFile 2>/dev/null || dos2unix $scriptFile 2>/dev/null || true"
Write-Host ""

# Step 4: Execute deployment
Write-Host "Step 4: Executing deployment on VPS..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes. Please wait..." -ForegroundColor Yellow
Write-Host "You will be prompted for your VPS password again" -ForegroundColor Yellow
Write-Host ""

# Execute the script on remote server
ssh "$vpsUser@$vpsIP" "cd $appDir && chmod +x $scriptFile && bash $scriptFile"

# Step 5: Check results
Write-Host ""
Write-Host "Step 5: Deployment execution completed" -ForegroundColor Yellow

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS: DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To check PM2 status:" -ForegroundColor Cyan
    Write-Host "  ssh $vpsUser@$vpsIP `"pm2 status`"" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the SSH output above for any errors." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To check PM2 status:" -ForegroundColor Cyan
    Write-Host "  ssh $vpsUser@$vpsIP `"pm2 status`"" -ForegroundColor White
    Write-Host ""
    Write-Host "To view PM2 logs:" -ForegroundColor Cyan
    Write-Host "  ssh $vpsUser@$vpsIP `"cd $appDir && pm2 logs cryptorafts --lines 50`"" -ForegroundColor White
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

