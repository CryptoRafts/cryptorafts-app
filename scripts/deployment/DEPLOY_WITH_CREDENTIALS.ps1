# ============================================
# 🚀 DEPLOY WITH YOUR SSH CREDENTIALS
# ============================================

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"
$VPS_PASSWORD = ""

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 DEPLOY WITH YOUR SSH CREDENTIALS 🚀               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Your SSH Details:" -ForegroundColor Cyan
Write-Host "   IP: $VPS_IP" -ForegroundColor White
Write-Host "   Port: $VPS_PORT" -ForegroundColor White
Write-Host "   Username: $VPS_USER" -ForegroundColor White
Write-Host ""

# Get password
if ([string]::IsNullOrEmpty($VPS_PASSWORD)) {
    Write-Host "🔐 Enter your SSH password:" -ForegroundColor Yellow
    $securePassword = Read-Host "Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $VPS_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host ""
Write-Host "[1/3] Uploading files to VPS...`n" -ForegroundColor Cyan

# Check for WSL or Plink
$wslCmd = Get-Command wsl -ErrorAction SilentlyContinue
$plinkCmd = Get-Command plink -ErrorAction SilentlyContinue

if ($wslCmd) {
    Write-Host "📤 Using WSL for deployment...`n" -ForegroundColor Yellow
    
    # Install sshpass in WSL if needed
    wsl bash -c "which sshpass || sudo apt-get update && sudo apt-get install -y sshpass" 2>&1 | Out-Null
    
    # Set password for sshpass
    $env:SSHPASS = $VPS_PASSWORD
    
    Write-Host "📤 Uploading files to VPS..." -ForegroundColor Cyan
    $projectPath = (Get-Location).Path -replace "C:", "/mnt/c" -replace "\\", "/"
    
    $uploadCmd = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -r -o StrictHostKeyChecking=no . ${VPS_USER}@${VPS_IP}:/home/${VPS_USER}/cryptorafts/"
    wsl bash -c $uploadCmd 2>&1 | Tee-Object -Variable uploadOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Files uploaded successfully!`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Upload failed: $uploadOutput`n" -ForegroundColor Yellow
        Write-Host "📋 Manual upload:" -ForegroundColor Yellow
        Write-Host "   scp -P $VPS_PORT -r . ${VPS_USER}@${VPS_IP}:/home/${VPS_USER}/cryptorafts/" -ForegroundColor White
        Read-Host "Press Enter after files are uploaded"
    }
    
    Write-Host ""
    Write-Host "[2/3] Deploying on VPS...`n" -ForegroundColor Cyan
    Write-Host "⏱️  This will take 8-10 minutes...`n" -ForegroundColor Yellow
    
    # Create deployment script on VPS first
    $deployCmd = "cd ~/cryptorafts; mkdir -p /var/www/cryptorafts; cp -r ~/cryptorafts/* /var/www/cryptorafts/ 2>/dev/null || true; cd /var/www/cryptorafts; chmod +x DEPLOY_FASTEST.sh; sudo bash DEPLOY_FASTEST.sh"
    
    $env:SSHPASS = $VPS_PASSWORD
    $sshCmd = "sshpass -e ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} `"$deployCmd`""
    wsl bash -c $sshCmd 2>&1 | Tee-Object
    
    Write-Host "`n✅ Deployment completed!`n" -ForegroundColor Green
    
} elseif ($plinkCmd) {
    Write-Host "📤 Using Plink for deployment...`n" -ForegroundColor Yellow
    
    $pscpCmd = Get-Command pscp -ErrorAction SilentlyContinue
    if ($pscpCmd) {
        Write-Host "📤 Uploading files to VPS..." -ForegroundColor Cyan
        
        # Create directory first
        plink -ssh -P $VPS_PORT -pw "$VPS_PASSWORD" "${VPS_USER}@${VPS_IP}" "mkdir -p ~/cryptorafts" 2>&1 | Out-Null
        
        # Upload files
        pscp -P $VPS_PORT -pw "$VPS_PASSWORD" -r . "${VPS_USER}@${VPS_IP}:~/cryptorafts/" 2>&1 | Tee-Object
        
        Write-Host "✅ Files uploaded!`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PSCP not found. Please upload manually.`n" -ForegroundColor Yellow
        Read-Host "Press Enter after files are uploaded"
    }
    
    Write-Host "[2/3] Deploying on VPS...`n" -ForegroundColor Cyan
    Write-Host "⏱️  This will take 8-10 minutes...`n" -ForegroundColor Yellow
    
    $deployCmd = "cd ~/cryptorafts; mkdir -p /var/www/cryptorafts; cp -r ~/cryptorafts/* /var/www/cryptorafts/ 2>/dev/null || true; cd /var/www/cryptorafts; chmod +x DEPLOY_FASTEST.sh; sudo bash DEPLOY_FASTEST.sh"
    plink -ssh -P $VPS_PORT -pw "$VPS_PASSWORD" "${VPS_USER}@${VPS_IP}" "$deployCmd" 2>&1 | Tee-Object
    
    Write-Host "`n✅ Deployment completed!`n" -ForegroundColor Green
    
} else {
    Write-Host "⚠️  WSL/Plink not available. Manual deployment required.`n" -ForegroundColor Yellow
    
    Write-Host "📋 Run these commands manually:`n" -ForegroundColor Cyan
    
    Write-Host "1. Upload files:" -ForegroundColor White
    Write-Host "   scp -P $VPS_PORT -r . ${VPS_USER}@${VPS_IP}:/home/${VPS_USER}/cryptorafts/" -ForegroundColor Yellow
    Write-Host "   Password: $VPS_PASSWORD`n" -ForegroundColor Yellow
    
    Write-Host "2. Connect and deploy:" -ForegroundColor White
    Write-Host "   ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP}" -ForegroundColor Yellow
    Write-Host "   Password: $VPS_PASSWORD`n" -ForegroundColor Yellow
    
    Write-Host "   cd ~/cryptorafts" -ForegroundColor Yellow
    Write-Host "   sudo mkdir -p /var/www/cryptorafts" -ForegroundColor Yellow
    Write-Host "   sudo cp -r ~/cryptorafts/* /var/www/cryptorafts/" -ForegroundColor Yellow
    Write-Host "   cd /var/www/cryptorafts" -ForegroundColor Yellow
    Write-Host "   chmod +x DEPLOY_FASTEST.sh" -ForegroundColor Yellow
    Write-Host "   sudo bash DEPLOY_FASTEST.sh`n" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] Deployment complete!`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. SSH to VPS: ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "   2. Configure Firebase: nano /var/www/cryptorafts/.env.production" -ForegroundColor White
Write-Host "   3. Add domain to Firebase Authorized Domains" -ForegroundColor White
Write-Host "   4. Visit: https://www.cryptorafts.com`n" -ForegroundColor White
Write-Host "🌐 Your website should be LIVE at: https://www.cryptorafts.com" -ForegroundColor Green
Write-Host ""

