# ============================================
# CRYPTORAFTS - DEPLOYMENT VIA SSH FROM POWERSHELL
# ============================================

Write-Host "`n🚀 CRYPTORAFTS - DEPLOYMENT VIA SSH FROM POWERSHELL" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"
$deployScript = "RUN_THIS_IN_SSH_NOW.sh"

Write-Host "📋 Step 1: Reading deployment script...`n" -ForegroundColor Yellow

# Read the deployment script
if (-not (Test-Path $deployScript)) {
    Write-Host "❌ $deployScript not found!" -ForegroundColor Red
    exit 1
}

$scriptContent = Get-Content $deployScript -Raw
Write-Host "✅ Deployment script loaded: $($scriptContent.Length) characters`n" -ForegroundColor Green

Write-Host "📋 Step 2: Preparing SSH deployment command...`n" -ForegroundColor Yellow

# Create the deployment command that will be executed via SSH
$deployCommand = @"
cd $appDir 2>/dev/null || mkdir -p $appDir && cd $appDir && cat > $deployScript << 'DEPLOYEOF'
$scriptContent
DEPLOYEOF
chmod +x $deployScript && bash $deployScript
"@

# Save command to file for manual execution
$deployCommand | Out-File -FilePath "SSH_DEPLOY_COMMAND.sh" -Encoding UTF8 -NoNewline
Write-Host "✅ SSH deployment command saved to SSH_DEPLOY_COMMAND.sh`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔧 EXECUTE DEPLOYMENT VIA SSH:`n" -ForegroundColor Yellow

Write-Host "Option 1: Using OpenSSH (if installed):" -ForegroundColor White
Write-Host "  ssh $vpsUser@$vpsIP `"$(Get-Content SSH_DEPLOY_COMMAND.sh -Raw)`"" -ForegroundColor Cyan

Write-Host "`nOption 2: Using WSL (if available):" -ForegroundColor White
Write-Host "  wsl ssh $vpsUser@$vpsIP `"`$(cat SSH_DEPLOY_COMMAND.sh)`"" -ForegroundColor Cyan

Write-Host "`nOption 3: Copy command manually:" -ForegroundColor White
Write-Host "  1. Copy contents of SSH_DEPLOY_COMMAND.sh" -ForegroundColor White
Write-Host "  2. SSH to server: ssh $vpsUser@$vpsIP" -ForegroundColor White
Write-Host "  3. Paste the command and press Enter`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📋 Step 3: Attempting SSH deployment...`n" -ForegroundColor Yellow

# Try to execute via SSH if OpenSSH is available
$sshPath = Get-Command ssh -ErrorAction SilentlyContinue

if ($sshPath) {
    Write-Host "✅ OpenSSH found: $($sshPath.Source)" -ForegroundColor Green
    Write-Host "`n🚀 Executing deployment via SSH...`n" -ForegroundColor Cyan
    
    # Execute deployment via SSH
    $deployCommand | & ssh "$vpsUser@$vpsIP" bash
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ DEPLOYMENT EXECUTED SUCCESSFULLY!`n" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  SSH execution completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
        Write-Host "Please check the output above or execute manually.`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  OpenSSH not found in PATH" -ForegroundColor Yellow
    Write-Host "`n📋 Please execute manually using one of the options above.`n" -ForegroundColor White
    
    Write-Host "To install OpenSSH in PowerShell (as Administrator):" -ForegroundColor White
    Write-Host "  Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0`n" -ForegroundColor Cyan
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT FILES READY:" -ForegroundColor Yellow
Write-Host "✅ SSH_DEPLOY_COMMAND.sh - Complete SSH command" -ForegroundColor Green
Write-Host "✅ RUN_THIS_IN_SSH_NOW.sh - Main deployment script`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

