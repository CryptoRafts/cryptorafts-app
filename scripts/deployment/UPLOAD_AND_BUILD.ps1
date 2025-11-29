# ============================================
# UPLOAD AND BUILD - WITH PASSWORD
# Uses sshpass to avoid password prompts
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"
$vpsPassword = "Shamsi2627@@"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UPLOAD AND BUILD" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if sshpass is available (Windows needs it installed)
$sshpassAvailable = Get-Command sshpass -ErrorAction SilentlyContinue

if (-not $sshpassAvailable) {
    Write-Host "⚠️  sshpass not found. You'll need to enter password manually." -ForegroundColor Yellow
    Write-Host "   Or install sshpass for Windows" -ForegroundColor Yellow
    Write-Host ""
    $useManual = $true
} else {
    $useManual = $false
}

# Function to run SSH with password
function Invoke-SSHWithPassword {
    param([string]$Command)
    
    if ($useManual) {
        ssh -o ConnectTimeout=10 -o ServerAliveInterval=5 "${vpsUser}@${vpsIp}" $Command
    } else {
        echo $vpsPassword | sshpass -p $vpsPassword ssh -o ConnectTimeout=10 -o ServerAliveInterval=5 -o StrictHostKeyChecking=no "${vpsUser}@${vpsIp}" $Command
    }
}

# Function to upload with password
function Invoke-SCPWithPassword {
    param([string]$LocalFile, [string]$RemotePath)
    
    if ($useManual) {
        scp -o ConnectTimeout=10 -o ServerAliveInterval=5 $LocalFile "${vpsUser}@${vpsIp}:${RemotePath}"
    } else {
        echo $vpsPassword | sshpass -p $vpsPassword scp -o ConnectTimeout=10 -o ServerAliveInterval=5 -o StrictHostKeyChecking=no $LocalFile "${vpsUser}@${vpsIp}:${RemotePath}"
    }
}

# Step 1: Upload build script
Write-Host "[1/4] Uploading build script..." -ForegroundColor Cyan
if (Test-Path "BUILD_ON_VPS.sh") {
    Invoke-SCPWithPassword -LocalFile "BUILD_ON_VPS.sh" -RemotePath "/root/BUILD_ON_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Build script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] BUILD_ON_VPS.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Make script executable and run it
Write-Host "[2/4] Running build on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 5-7 minutes..." -ForegroundColor Yellow
Write-Host "  You may need to enter password..." -ForegroundColor Yellow
Write-Host ""

$buildCommand = "chmod +x /root/BUILD_ON_VPS.sh && /root/BUILD_ON_VPS.sh"
Invoke-SSHWithPassword -Command $buildCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[OK] BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your site should now be working at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    Write-Host "  Run manually on VPS:" -ForegroundColor Yellow
    Write-Host "    cd /var/www/cryptorafts" -ForegroundColor White
    Write-Host "    npm install --legacy-peer-deps" -ForegroundColor White
    Write-Host "    npm run build" -ForegroundColor White
    Write-Host "    pm2 restart cryptorafts" -ForegroundColor White
    exit 1
}

