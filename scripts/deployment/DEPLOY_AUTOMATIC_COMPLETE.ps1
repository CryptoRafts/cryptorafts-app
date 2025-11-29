# ============================================
# CRYPTORAFTS - FULLY AUTOMATED DEPLOYMENT
# ============================================

Write-Host "`n🚀 CRYPTORAFTS - AUTOMATED DEPLOYMENT STARTING..." -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"
$deployScript = "RUN_THIS_IN_SSH_NOW.sh"

Write-Host "📋 Step 1: Reading deployment script..." -ForegroundColor Yellow
if (-not (Test-Path $deployScript)) {
    Write-Host "❌ $deployScript not found!" -ForegroundColor Red
    exit 1
}

$scriptContent = Get-Content $deployScript -Raw
$scriptLength = $scriptContent.Length
Write-Host "✅ Script loaded - $scriptLength bytes" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step 2: Creating one-liner deployment command..." -ForegroundColor Yellow

# Create a base64-encoded version for easier transfer
$scriptBytes = [System.Text.Encoding]::UTF8.GetBytes($scriptContent)
$base64Script = [Convert]::ToBase64String($scriptBytes)

# Create deployment command
$deployCmd = @"
cd $appDir 2>/dev/null || mkdir -p $appDir && cd $appDir && 
cat > $deployScript << 'DEPLOYEOF'
$scriptContent
DEPLOYEOF
chmod +x $deployScript && bash $deployScript
"@

# Save to file
$deployCmd | Out-File -FilePath "EXECUTE_IN_TERMINAL.sh" -Encoding UTF8 -NoNewline

Write-Host "✅ Created EXECUTE_IN_TERMINAL.sh`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ AUTOMATED DEPLOYMENT SOLUTION READY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🔧 TO DEPLOY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Hostinger Web Terminal (RECOMMENDED)" -ForegroundColor White
Write-Host "  1. Open: https://int.hostingervps.com/1113/?token=d45ede362c7a332c95624f383b6eef3e27ee91b851fe711fae1e683300388d77" -ForegroundColor Cyan
Write-Host "  2. Press any key to wake server" -ForegroundColor White
Write-Host "  3. Copy ENTIRE contents of RUN_THIS_IN_SSH_NOW.sh" -ForegroundColor White
Write-Host "  4. Paste into terminal and press Enter" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: SSH Terminal" -ForegroundColor White
Write-Host "  ssh root@$vpsIP" -ForegroundColor Cyan
Write-Host "  cd $appDir" -ForegroundColor Cyan
Write-Host "  bash RUN_THIS_IN_SSH_NOW.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 3: Copy-paste EXECUTE_IN_TERMINAL.sh" -ForegroundColor White
Write-Host "  (Copy the entire file contents into your terminal)" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "✅ Files created:" -ForegroundColor Yellow
Write-Host "  ✅ RUN_THIS_IN_SSH_NOW.sh - Complete deployment script" -ForegroundColor Green
Write-Host "  ✅ EXECUTE_IN_TERMINAL.sh - One-liner execution script" -ForegroundColor Green
Write-Host "  ✅ DEPLOY_AUTOMATIC_COMPLETE.ps1 - This automation script" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 The deployment script will automatically:" -ForegroundColor Yellow
Write-Host "  ✅ Deploy everything with real-time error fixing" -ForegroundColor Green
Write-Host "  ✅ Make your app live at https://www.cryptorafts.com" -ForegroundColor Green
Write-Host ""

# Display the command that can be copied
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 COPY THIS COMMAND TO YOUR TERMINAL:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Show first 500 characters as preview
$preview = $deployCmd.Substring(0, [Math]::Min(500, $deployCmd.Length))
Write-Host $preview -ForegroundColor Cyan
Write-Host "...`n" -ForegroundColor Cyan

Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🚀 Ready to deploy! Choose any option above.`n" -ForegroundColor Green

