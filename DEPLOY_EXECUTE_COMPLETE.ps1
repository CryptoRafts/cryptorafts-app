# ============================================
# CRYPTORAFTS - COMPLETE DEPLOYMENT EXECUTION
# ============================================

Write-Host "`n🚀 CRYPTORAFTS - COMPLETE DEPLOYMENT EXECUTION" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$vpsIP = "72.61.98.99"
$appDir = "/var/www/cryptorafts"
$deployScript = "RUN_THIS_IN_SSH_NOW.sh"

Write-Host "📋 Step 1: Preparing deployment..." -ForegroundColor Yellow

# Read the deployment script
if (-not (Test-Path $deployScript)) {
    Write-Host "❌ $deployScript not found!" -ForegroundColor Red
    exit 1
}

$scriptContent = Get-Content $deployScript -Raw
Write-Host "✅ Deployment script loaded`n" -ForegroundColor Green

# Create command to create and execute the script
$deployCommand = @"
cd $appDir 2>/dev/null || mkdir -p $appDir && cd $appDir && cat > $deployScript << 'DEPLOYEOF'
$scriptContent
DEPLOYEOF
chmod +x $deployScript && bash $deployScript
"@

# Save command to file
$deployCommand | Out-File -FilePath "EXECUTE_NOW.txt" -Encoding UTF8 -NoNewline

Write-Host "📋 Step 2: Deployment command created`n" -ForegroundColor Yellow
Write-Host "✅ File created: EXECUTE_NOW.txt`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔧 TO DEPLOY YOUR APP 100% LIVE:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "1. The Hostinger terminal is open in your browser" -ForegroundColor White
Write-Host "2. Copy ENTIRE contents of EXECUTE_NOW.txt" -ForegroundColor White
Write-Host "3. Paste into the terminal (Ctrl+V or Right-click > Paste)" -ForegroundColor White
Write-Host "4. Press Enter`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "✅ The deployment script will automatically:" -ForegroundColor Yellow
Write-Host "  ✅ Fix all VPS problems" -ForegroundColor Green
Write-Host "  ✅ Configure everything" -ForegroundColor Green
Write-Host "  ✅ Deploy complete application" -ForegroundColor Green
Write-Host "  ✅ Make your app 100% LIVE!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your app will be live at:" -ForegroundColor Yellow
Write-Host "   https://www.cryptorafts.com`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

