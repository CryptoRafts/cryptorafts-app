# CRYPTORAFTS - DEPLOYMENT VIA SSH FROM POWERSHELL
# Run this script to deploy directly via SSH

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"
$scriptFile = "RUN_THIS_IN_SSH_NOW.sh"

Write-Host ""
Write-Host "CRYPTORAFTS - DEPLOYMENT VIA SSH" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $scriptFile)) {
    Write-Host "ERROR: $scriptFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Reading deployment script..." -ForegroundColor Yellow
$scriptContent = Get-Content $scriptFile -Raw

Write-Host "Preparing SSH deployment command..." -ForegroundColor Yellow

# Create command to upload and execute the script
$deployCmd = @"
cd $appDir 2>/dev/null || mkdir -p $appDir && cd $appDir && cat > $scriptFile << 'SCRIPTEOF'
$scriptContent
SCRIPTEOF
chmod +x $scriptFile && bash $scriptFile
"@

# Save command for manual execution
$deployCmd | Out-File "SSH_COMMAND.txt" -Encoding UTF8 -NoNewline

Write-Host "SUCCESS: SSH command saved to SSH_COMMAND.txt" -ForegroundColor Green
Write-Host ""
Write-Host "EXECUTING DEPLOYMENT NOW..." -ForegroundColor Cyan
Write-Host ""

# Execute via SSH
$deployCmd | ssh "$vpsUser@$vpsIP" bash

Write-Host ""
Write-Host "Deployment execution completed!" -ForegroundColor Green
Write-Host "Check output above for deployment status." -ForegroundColor Yellow
Write-Host ""

