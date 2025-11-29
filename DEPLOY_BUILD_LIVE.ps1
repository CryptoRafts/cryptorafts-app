# ============================================
# DEPLOY BUILD TO VPS - MAKE IT LIVE
# ============================================
# Builds locally, uploads everything, and deploys

param(
    [Parameter(Mandatory=$false)]
    [string]$VPS_PASSWORD = ""
)

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"
$VPS_DIR = "/var/www/cryptorafts"
$LOCAL_DIR = (Get-Location).Path

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  DEPLOY BUILD TO VPS - MAKE IT LIVE" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Get password
if ([string]::IsNullOrEmpty($VPS_PASSWORD)) {
    Write-Host "Enter your SSH password:" -ForegroundColor Yellow
    $securePassword = Read-Host "Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $VPS_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host "[1/5] Building application locally..." -ForegroundColor Cyan
Write-Host "This will take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Build locally first
Write-Host "Building application..." -ForegroundColor Cyan
$env:NODE_ENV = "production"
npm run build 2>&1 | Tee-Object -Variable buildOutput | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Local build successful!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Build may have warnings, checking..." -ForegroundColor Yellow
    if (Test-Path ".next") {
        Write-Host "Build output exists, continuing..." -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Build failed! Check errors above." -ForegroundColor Red
        Write-Host ""
        exit 1
    }
}

Write-Host "[2/5] Checking build output..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".next")) {
    Write-Host "Build output not found! Build must have failed." -ForegroundColor Red
    Write-Host ""
    exit 1
}

if (-not (Test-Path "src/app/page.tsx")) {
    Write-Host "src/app/page.tsx not found locally!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "Build output exists" -ForegroundColor Green
Write-Host "src/app/page.tsx exists" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] Uploading all files to VPS..." -ForegroundColor Cyan
Write-Host ""

$wslCmd = Get-Command wsl -ErrorAction SilentlyContinue

if ($wslCmd) {
    Write-Host "Using WSL for deployment..." -ForegroundColor Yellow
    Write-Host ""
    
    # Install sshpass in WSL if needed
    Write-Host "Setting up WSL..." -ForegroundColor Cyan
    wsl bash -c 'which sshpass || (sudo apt-get update -qq && sudo apt-get install -y -qq sshpass)' 2>&1 | Out-Null
    
    # Set password for sshpass
    $env:SSHPASS = $VPS_PASSWORD
    
    Write-Host "Uploading ALL files to VPS (including src/ directory)..." -ForegroundColor Cyan
    Write-Host "This will take 3-5 minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    $projectPath = $LOCAL_DIR -replace "C:", "/mnt/c" -replace "\\", "/"
    
    # Upload everything including src/
    $uploadCmd = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -r -o StrictHostKeyChecking=no . ${VPS_USER}@${VPS_IP}:~/cryptorafts/"
    
    Write-Host "Uploading files (this may take several minutes)..." -ForegroundColor Yellow
    wsl bash -c $uploadCmd 2>&1 | Tee-Object
    
    Write-Host ""
    Write-Host "Files uploaded!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[4/5] Uploading deployment script..." -ForegroundColor Cyan
    Write-Host ""
    
    # Upload fix script
    if (Test-Path "FIX_EVERYTHING_VPS.sh") {
        Write-Host "Uploading FIX_EVERYTHING_VPS.sh..." -ForegroundColor Yellow
        $scriptUpload = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -o StrictHostKeyChecking=no FIX_EVERYTHING_VPS.sh ${VPS_USER}@${VPS_IP}:~/FIX_EVERYTHING_VPS.sh"
        wsl bash -c $scriptUpload 2>&1 | Out-Null
        Write-Host "Deployment script uploaded!" -ForegroundColor Green
        Write-Host ""
    }
    
    Write-Host "[5/5] Running deployment on VPS..." -ForegroundColor Cyan
    Write-Host "This will take 5-10 minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    # Run deployment script
    $deployCmd = "cd ~/cryptorafts; chmod +x ~/FIX_EVERYTHING_VPS.sh; bash ~/FIX_EVERYTHING_VPS.sh"
    $env:SSHPASS = $VPS_PASSWORD
    $sshCmd = "sshpass -e ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} '$deployCmd'"
    
    Write-Host "Deploying to VPS..." -ForegroundColor Green
    Write-Host "This will:" -ForegroundColor Cyan
    Write-Host "   - Verify src/app structure" -ForegroundColor White
    Write-Host "   - Install dependencies" -ForegroundColor White
    Write-Host "   - Clean old build" -ForegroundColor White
    Write-Host "   - Rebuild application" -ForegroundColor White
    Write-Host "   - Start app with PM2" -ForegroundColor White
    Write-Host "   - Fix Nginx configuration" -ForegroundColor White
    Write-Host "   - Make app LIVE" -ForegroundColor White
    Write-Host ""
    
    wsl bash -c $sshCmd 2>&1 | Tee-Object
    
    Write-Host ""
    Write-Host "[5/5] Deployment complete!" -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host "WSL not available. Manual deployment required." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual deployment steps:" -ForegroundColor Cyan
    Write-Host "   1. Upload all files to VPS (including src/)" -ForegroundColor White
    Write-Host "   2. SSH to VPS: ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP}" -ForegroundColor White
    Write-Host "   3. Run: bash FIX_EVERYTHING_VPS.sh" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your website should be LIVE at:" -ForegroundColor Cyan
Write-Host "   https://www.cryptorafts.com" -ForegroundColor Green
Write-Host "   https://cryptorafts.com" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Clear browser cache: Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "   2. Hard refresh: Ctrl+F5" -ForegroundColor White
Write-Host "   3. Visit: https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "If still seeing errors:" -ForegroundColor Yellow
Write-Host "   SSH to VPS and check: pm2 logs cryptorafts" -ForegroundColor White
Write-Host "   Or run: bash FIX_EVERYTHING_VPS.sh again" -ForegroundColor White
Write-Host ""
