# ============================================
# CRYPTORAFTS - DEPLOYMENT VIA SSH FROM POWERSHELL
# ============================================

Write-Host ""
Write-Host "CRYPTORAFTS - DEPLOYMENT VIA SSH FROM POWERSHELL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"
$deployScript = "RUN_THIS_IN_SSH_NOW.sh"

Write-Host "Step 1: Reading deployment script..." -ForegroundColor Yellow
Write-Host ""

# Read the deployment script
if (-not (Test-Path $deployScript)) {
    Write-Host "ERROR: $deployScript not found!" -ForegroundColor Red
    exit 1
}

$scriptContent = Get-Content $deployScript -Raw
Write-Host "SUCCESS: Deployment script loaded: $($scriptContent.Length) characters" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Preparing SSH deployment command..." -ForegroundColor Yellow
Write-Host ""

# Create the deployment command that will be executed via SSH
$deployCommand = @"
cd $appDir 2>/dev/null || mkdir -p $appDir && cd $appDir && cat > $deployScript << 'DEPLOYEOF'
$scriptContent
DEPLOYEOF
chmod +x $deployScript && bash $deployScript
"@

# Save command to file for manual execution
$deployCommand | Out-File -FilePath "SSH_DEPLOY_COMMAND.sh" -Encoding UTF8 -NoNewline
Write-Host "SUCCESS: SSH deployment command saved to SSH_DEPLOY_COMMAND.sh" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "EXECUTE DEPLOYMENT VIA SSH:" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Using OpenSSH (if installed):" -ForegroundColor White
Write-Host "  ssh $vpsUser@$vpsIP bash -s < SSH_DEPLOY_COMMAND.sh" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 2: Copy command manually:" -ForegroundColor White
Write-Host "  1. Copy contents of SSH_DEPLOY_COMMAND.sh" -ForegroundColor White
Write-Host "  2. SSH to server: ssh $vpsUser@$vpsIP" -ForegroundColor White
Write-Host "  3. Paste the command and press Enter" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 3: Attempting SSH deployment..." -ForegroundColor Yellow
Write-Host ""

# Try to execute via SSH if OpenSSH is available
$sshPath = Get-Command ssh -ErrorAction SilentlyContinue

if ($sshPath) {
    Write-Host "SUCCESS: OpenSSH found: $($sshPath.Source)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Executing deployment via SSH..." -ForegroundColor Cyan
    Write-Host ""
    
    # Execute deployment via SSH using stdin
    Get-Content "SSH_DEPLOY_COMMAND.sh" -Raw | ssh "$vpsUser@$vpsIP" bash
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: DEPLOYMENT EXECUTED!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "WARNING: SSH execution completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
        Write-Host "Please check the output above or execute manually." -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "WARNING: OpenSSH not found in PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please execute manually using one of the options above." -ForegroundColor White
    Write-Host ""
    Write-Host "To install OpenSSH in PowerShell (as Administrator):" -ForegroundColor White
    Write-Host "  Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT FILES READY:" -ForegroundColor Yellow
Write-Host "SUCCESS: SSH_DEPLOY_COMMAND.sh - Complete SSH command" -ForegroundColor Green
Write-Host "SUCCESS: RUN_THIS_IN_SSH_NOW.sh - Main deployment script" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

