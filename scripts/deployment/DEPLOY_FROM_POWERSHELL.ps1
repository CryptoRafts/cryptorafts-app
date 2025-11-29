# ============================================
# CRYPTORAFTS - COMPLETE DEPLOYMENT FROM POWERSHELL
# ============================================
# Run this script in PowerShell to deploy your app to VPS
# ============================================

Write-Host ""
Write-Host "CRYPTORAFTS - DEPLOYMENT FROM POWERSHELL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# VPS Configuration
$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"
$scriptFile = "RUN_THIS_IN_SSH_NOW.sh"

# Step 1: Check if deployment script exists
Write-Host "Step 1: Checking deployment files..." -ForegroundColor Yellow
if (-not (Test-Path $scriptFile)) {
    Write-Host "ERROR: $scriptFile not found!" -ForegroundColor Red
    Write-Host "Please ensure RUN_THIS_IN_SSH_NOW.sh exists in current directory" -ForegroundColor Yellow
    exit 1
}
Write-Host "SUCCESS: Deployment script found" -ForegroundColor Green
Write-Host ""

# Step 2: Read deployment script
Write-Host "Step 2: Reading deployment script..." -ForegroundColor Yellow
$scriptContent = Get-Content $scriptFile -Raw
Write-Host "SUCCESS: Script loaded ($($scriptContent.Length) characters)" -ForegroundColor Green
Write-Host ""

# Step 3: Create SSH deployment command
Write-Host "Step 3: Preparing SSH deployment command..." -ForegroundColor Yellow
$deployCmd = @"
cd $appDir 2>/dev/null || mkdir -p $appDir && cd $appDir && cat > $scriptFile << 'DEPLOYEOF'
$scriptContent
DEPLOYEOF
chmod +x $scriptFile && bash $scriptFile
"@

# Save command to file
$deployCmd | Out-File "SSH_DEPLOY_COMMAND.txt" -Encoding UTF8 -NoNewline
Write-Host "SUCCESS: SSH command saved to SSH_DEPLOY_COMMAND.txt" -ForegroundColor Green
Write-Host ""

# Step 4: Check if SSH is available
Write-Host "Step 4: Checking SSH availability..." -ForegroundColor Yellow
$sshPath = Get-Command ssh -ErrorAction SilentlyContinue

if (-not $sshPath) {
    Write-Host "WARNING: SSH not found in PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install OpenSSH in PowerShell (Run as Administrator):" -ForegroundColor White
    Write-Host "  Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use manual SSH connection:" -ForegroundColor White
    Write-Host "  1. Open PowerShell or Terminal" -ForegroundColor White
    Write-Host "  2. Run: ssh $vpsUser@$vpsIP" -ForegroundColor Cyan
    Write-Host "  3. Copy contents of SSH_DEPLOY_COMMAND.txt" -ForegroundColor White
    Write-Host "  4. Paste into SSH terminal and press Enter" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "SUCCESS: SSH found at $($sshPath.Source)" -ForegroundColor Green
Write-Host ""

# Step 5: Execute deployment via SSH
Write-Host "Step 5: Executing deployment via SSH..." -ForegroundColor Yellow
Write-Host "Connecting to $vpsUser@$vpsIP..." -ForegroundColor Cyan
Write-Host "This will take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

# Execute deployment
$deployCmd | ssh "$vpsUser@$vpsIP" bash

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: DEPLOYMENT COMPLETED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app should now be live at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the output above for any errors." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

