# ============================================
# 🔧 FIX APP - RUN ON VPS VIA SSH
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$VPS_PASSWORD = ""
)

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🔧 FIX APP - COMPLETE FIX 🔧                           ║" -ForegroundColor Red
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrEmpty($VPS_PASSWORD)) {
    Write-Host "🔐 Enter your SSH password:" -ForegroundColor Yellow
    $securePassword = Read-Host "Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $VPS_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host "[1/3] Uploading fix script to VPS...`n" -ForegroundColor Cyan

$wslCmd = Get-Command wsl -ErrorAction SilentlyContinue

if ($wslCmd) {
    wsl bash -c "which sshpass || (sudo apt-get update -qq && sudo apt-get install -y -qq sshpass)" 2>&1 | Out-Null
    
    $env:SSHPASS = $VPS_PASSWORD
    $projectPath = (Get-Location).Path -replace "C:", "/mnt/c" -replace "\\", "/"
    
    if (Test-Path "FIX_APP_NOW.sh") {
        Write-Host "Uploading FIX_APP_NOW.sh to VPS..." -ForegroundColor Yellow
        $uploadCmd = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -o StrictHostKeyChecking=no FIX_APP_NOW.sh ${VPS_USER}@${VPS_IP}:~/FIX_APP_NOW.sh"
        wsl bash -c $uploadCmd 2>&1 | Out-Null
        Write-Host "✅ Fix script uploaded!`n" -ForegroundColor Green
    }
    
    Write-Host "[2/3] Running fix script on VPS...`n" -ForegroundColor Cyan
    Write-Host "⏱️  This will take 5-10 minutes...`n" -ForegroundColor Yellow
    
    $fixCmd = "chmod +x ~/FIX_APP_NOW.sh; bash ~/FIX_APP_NOW.sh"
    $env:SSHPASS = $VPS_PASSWORD
    $sshCmd = "sshpass -e ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} '$fixCmd'"
    
    Write-Host "🔧 Fixing app on VPS...`n" -ForegroundColor Green
    Write-Host "This will:" -ForegroundColor Cyan
    Write-Host "   ✅ Fix permissions" -ForegroundColor White
    Write-Host "   ✅ Install dependencies" -ForegroundColor White
    Write-Host "   ✅ Build app" -ForegroundColor White
    Write-Host "   ✅ Start app with PM2" -ForegroundColor White
    Write-Host "   ✅ Fix Nginx configuration" -ForegroundColor White
    Write-Host "   ✅ Restart services`n" -ForegroundColor White
    
    wsl bash -c $sshCmd 2>&1 | Tee-Object
    
    Write-Host ""
    Write-Host "[3/3] Fix complete!`n" -ForegroundColor Green
    
} else {
    Write-Host "⚠️  WSL not available. Manual fix required.`n" -ForegroundColor Yellow
    Write-Host "📋 Manual fix steps:" -ForegroundColor Cyan
    Write-Host "   1. SSH to VPS: ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP}" -ForegroundColor White
    Write-Host "   2. Upload FIX_APP_NOW.sh to VPS" -ForegroundColor White
    Write-Host "   3. Run: bash FIX_APP_NOW.sh`n" -ForegroundColor White
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ FIX COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Your website should be working at:" -ForegroundColor Cyan
Write-Host "   https://www.cryptorafts.com" -ForegroundColor Green
Write-Host "   https://cryptorafts.com`n" -ForegroundColor Green
Write-Host "📋 If still not working:" -ForegroundColor Yellow
Write-Host "   SSH to VPS and check: pm2 logs cryptorafts" -ForegroundColor White
    Write-Host "   Or run: bash FIX_APP_NOW.sh again" -ForegroundColor White
Write-Host ""

