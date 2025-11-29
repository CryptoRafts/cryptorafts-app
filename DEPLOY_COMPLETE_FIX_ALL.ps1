# ============================================
# CRYPTORAFTS - COMPLETE DEPLOYMENT & FIX ALL
# ============================================

Write-Host "`n🚀 CRYPTORAFTS - COMPLETE DEPLOYMENT & FIX ALL VPS PROBLEMS" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "📋 Preparing complete deployment solution...`n" -ForegroundColor Yellow

# Read deployment script
$deployScript = "RUN_THIS_IN_SSH_NOW.sh"
if (-not (Test-Path $deployScript)) {
    Write-Host "❌ $deployScript not found!" -ForegroundColor Red
    exit 1
}

$scriptContent = Get-Content $deployScript -Raw

# Create one-liner command
$deployCommand = "cd /var/www/cryptorafts 2>/dev/null || mkdir -p /var/www/cryptorafts && cd /var/www/cryptorafts && cat > RUN_THIS_IN_SSH_NOW.sh << 'DEPLOYEOF'`n$scriptContent`nDEPLOYEOF`nchmod +x RUN_THIS_IN_SSH_NOW.sh && bash RUN_THIS_IN_SSH_NOW.sh"

# Save to file
[System.IO.File]::WriteAllText("$PWD\EXECUTE_NOW.txt", $deployCommand)

Write-Host "✅ EXECUTE_NOW.txt created`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT READY - FIX ALL VPS PROBLEMS NOW`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🔧 TO DEPLOY 100% LIVE NOW:`n" -ForegroundColor Yellow

Write-Host "1. Hostinger terminal is OPEN in your browser" -ForegroundColor White
Write-Host "   URL: https://int.hostingervps.com/1113/?token=9dda82a747153e48cca5506536419c05e5734639552ee20c8ca8dbb7c6de4673`n" -ForegroundColor Cyan

Write-Host "2. Copy ENTIRE contents of EXECUTE_NOW.txt`n" -ForegroundColor White

Write-Host "3. Paste into Hostinger terminal (Ctrl+V or Right-click > Paste)`n" -ForegroundColor White

Write-Host "4. Press Enter and wait 5-10 minutes`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "✅ The script will automatically:`n" -ForegroundColor Yellow
Write-Host "  ✅ Fix 502 Bad Gateway error" -ForegroundColor Green
Write-Host "  ✅ Fix all VPS problems" -ForegroundColor Green
Write-Host "  ✅ Configure everything" -ForegroundColor Green
Write-Host "  ✅ Deploy complete application" -ForegroundColor Green
Write-Host "  ✅ Make your app 100% LIVE!`n" -ForegroundColor Green

Write-Host "🌐 After deployment, your app will be 100% LIVE at:`n" -ForegroundColor Yellow
Write-Host "   https://www.cryptorafts.com`n" -ForegroundColor Cyan

Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🚀 READY TO DEPLOY! Copy EXECUTE_NOW.txt and paste into terminal!`n" -ForegroundColor Green

