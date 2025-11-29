# ============================================
# 🚀 FULLY AUTOMATED DEPLOYMENT - SIMPLIFIED
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$VPS_IP,
    [Parameter(Mandatory=$true)]
    [string]$VPS_PASSWORD
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 FULLY AUTOMATED DEPLOYMENT 🚀                       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Install sshpass equivalent for Windows (using WSL or direct method)
Write-Host "[1/4] Preparing deployment..." -ForegroundColor Cyan

$projectRoot = Get-Location
Set-Location $projectRoot

# Ensure VPS config
Copy-Item "next.config.vps.js" "next.config.js" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Files prepared" -ForegroundColor Green

# Upload files
Write-Host ""
Write-Host "[2/4] Uploading files..." -ForegroundColor Cyan

# Check for WSL
$wslAvailable = Get-Command wsl -ErrorAction SilentlyContinue

if ($wslAvailable) {
    Write-Host "Using WSL for SSH/SCP..." -ForegroundColor Yellow
    
    # Install sshpass in WSL if needed
    wsl bash -c "which sshpass || sudo apt-get install -y sshpass" 2>&1 | Out-Null
    
    # Upload via WSL
    $env:SSHPASS = $VPS_PASSWORD
    wsl bash -c "cd /mnt/c/Users/dell/cryptorafts-starter && sshpass -e scp -r -o StrictHostKeyChecking=no . root@${VPS_IP}:/var/www/cryptorafts/" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Files uploaded" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Upload failed, trying alternative method..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  WSL not available. Please install WSL or use manual upload:" -ForegroundColor Yellow
    Write-Host "   scp -r . root@${VPS_IP}:/var/www/cryptorafts/" -ForegroundColor White
    Write-Host "   Password: $VPS_PASSWORD" -ForegroundColor Yellow
    Read-Host "Press Enter after files are uploaded"
}

# Deploy
Write-Host ""
Write-Host "[3/4] Deploying on VPS..." -ForegroundColor Cyan

$deployCmd = "cd /var/www/cryptorafts && chmod +x DEPLOY_FASTEST.sh && sudo bash DEPLOY_FASTEST.sh"

if ($wslAvailable) {
    $env:SSHPASS = $VPS_PASSWORD
    Write-Host "🚀 Running deployment (this takes 8-10 minutes)..." -ForegroundColor Yellow
    wsl bash -c "sshpass -e ssh -o StrictHostKeyChecking=no root@${VPS_IP} '$deployCmd'" 2>&1 | Tee-Object
} else {
    Write-Host "⚠️  Please run manually:" -ForegroundColor Yellow
    Write-Host "   ssh root@${VPS_IP}" -ForegroundColor White
    Write-Host "   $deployCmd" -ForegroundColor White
    Write-Host "   Password: $VPS_PASSWORD" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/4] Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Visit: https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""

