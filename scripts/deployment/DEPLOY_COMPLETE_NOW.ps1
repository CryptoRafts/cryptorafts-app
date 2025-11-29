# ============================================
# CRYPTORAFTS - COMPLETE AUTOMATED DEPLOYMENT
# ============================================

Write-Host "`n🚀 CRYPTORAFTS - COMPLETE AUTOMATED DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

# Step 1: Prepare deployment script
Write-Host "📋 Step 1: Preparing deployment script..." -ForegroundColor Yellow
$deployScript = "RUN_THIS_IN_SSH_NOW.sh"
if (-not (Test-Path $deployScript)) {
    Write-Host "❌ $deployScript not found!" -ForegroundColor Red
    exit 1
}

$scriptContent = Get-Content $deployScript -Raw
Write-Host "✅ Script prepared ($($scriptContent.Length) characters)`n" -ForegroundColor Green

# Step 2: Create command for terminal execution
Write-Host "📋 Step 2: Creating terminal command..." -ForegroundColor Yellow

# Create a simple one-liner that creates and executes the script
$deployCommand = @"
cd $appDir 2>/dev/null || mkdir -p $appDir && cd $appDir && cat > $deployScript << 'DEPLOYEOF'
$scriptContent
DEPLOYEOF
chmod +x $deployScript && bash $deployScript
"@

# Save to file
$deployCommand | Out-File -FilePath "COPY_TO_TERMINAL.txt" -Encoding UTF8 -NoNewline

Write-Host "✅ Command created in COPY_TO_TERMINAL.txt`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT SOLUTION READY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🔧 TO DEPLOY YOUR APP 100% LIVE:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Hostinger Web Terminal:" -ForegroundColor White
Write-Host "   https://int.hostingervps.com/1113/?token=d45ede362c7a332c95624f383b6eef3e27ee91b851fe711fae1e683300388d77" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Copy ENTIRE contents of COPY_TO_TERMINAL.txt" -ForegroundColor White
Write-Host ""
Write-Host "3. Paste into terminal and press Enter" -ForegroundColor White
Write-Host ""
Write-Host "4. Wait for deployment to complete (5-10 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "✅ The deployment script will automatically:" -ForegroundColor Yellow
Write-Host "  ✅ Update all SEO keywords" -ForegroundColor Green
Write-Host "  ✅ Configure Firebase and API keys" -ForegroundColor Green
Write-Host "  ✅ Install dependencies" -ForegroundColor Green
Write-Host "  ✅ Build application (with auto-retry)" -ForegroundColor Green
Write-Host "  ✅ Configure Nginx for www.cryptorafts.com" -ForegroundColor Green
Write-Host "  ✅ Setup SSL certificate" -ForegroundColor Green
Write-Host "  ✅ Start PM2 process" -ForegroundColor Green
Write-Host "  ✅ Make your app 100% LIVE!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 After deployment, your app will be live at:" -ForegroundColor Yellow
Write-Host "   https://www.cryptorafts.com`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

