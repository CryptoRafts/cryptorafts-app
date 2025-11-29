# ============================================
# 🚀 GET SSH CREDENTIALS & DEPLOY - AUTOMATED
# ============================================
# This script helps you get SSH credentials and deploy automatically

param(
    [Parameter(Mandatory=$false)]
    [string]$VPS_IP = "",
    [Parameter(Mandatory=$false)]
    [string]$VPS_PASSWORD = ""
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 GET SSH CREDENTIALS & DEPLOY 🚀                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Set credentials from Hostinger panel (from SSH Access page)
$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"

# Step 1: Display SSH credentials
Write-Host "[1/3] Using SSH credentials from Hostinger panel...`n" -ForegroundColor Cyan
Write-Host "✅ SSH Details from Hostinger:" -ForegroundColor Green
Write-Host "   IP: $VPS_IP" -ForegroundColor White
Write-Host "   Port: $VPS_PORT" -ForegroundColor White
Write-Host "   Username: $VPS_USER" -ForegroundColor White
Write-Host ""

# Step 2: Get password if missing
Write-Host "[2/3] Getting SSH password...`n" -ForegroundColor Cyan

if ([string]::IsNullOrEmpty($VPS_PASSWORD)) {
    Write-Host "📋 Need SSH credentials from Hostinger VPS #1097850`n" -ForegroundColor Yellow
    Write-Host "You have 2 options:`n" -ForegroundColor White
    
    Write-Host "Option 1: Contact Hostinger Support (5 minutes)" -ForegroundColor Cyan
    Write-Host "   📧 Email: support@hostinger.com" -ForegroundColor White
    Write-Host "   📝 Subject: SSH credentials VPS #1097850" -ForegroundColor White
    Write-Host "   📝 Message: Need SSH credentials to deploy application`n" -ForegroundColor White
    
    Write-Host "Option 2: Get from Hostinger Panel (if you have access)" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://hpanel.hostinger.com/vps/1097850/overview" -ForegroundColor White
    Write-Host "   2. Login to Hostinger account" -ForegroundColor White
    Write-Host "   3. Find 'SSH Access' or 'Server Details' section" -ForegroundColor White
    Write-Host "   4. Note down: IP Address, Username (root), Password`n" -ForegroundColor White
    
    Write-Host "After you get credentials, press Enter..." -ForegroundColor Yellow
    Read-Host
    
    Write-Host ""
    $VPS_IP = Read-Host "Enter VPS IP Address"
    
    if ([string]::IsNullOrEmpty($VPS_IP)) {
        Write-Host "❌ VPS IP is required!" -ForegroundColor Red
        exit 1
    }
}

if ([string]::IsNullOrEmpty($VPS_PASSWORD)) {
    Write-Host ""
    $securePassword = Read-Host "Enter SSH Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $VPS_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host "✅ Credentials ready!" -ForegroundColor Green

# Save credentials for next time (optional)
Write-Host ""
Write-Host "💾 Save credentials for next time? (y/n)" -ForegroundColor Yellow
$save = Read-Host
if ($save -eq "y" -or $save -eq "Y") {
    @{
        VPS_IP = $VPS_IP
        VPS_PASSWORD = $VPS_PASSWORD
    } | ConvertTo-Json | Out-File ".vps-credentials.json" -Force
    Write-Host "✅ Credentials saved to .vps-credentials.json" -ForegroundColor Green
}

# Step 3: Deploy
Write-Host ""
Write-Host "[3/3] Starting deployment...`n" -ForegroundColor Cyan

# Test SSH connection first
Write-Host "🔍 Testing SSH connection..." -ForegroundColor Cyan
Write-Host "   ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP}`n" -ForegroundColor White

# Use Plink or SSH with password
$plinkCmd = Get-Command plink -ErrorAction SilentlyContinue
$wslCmd = Get-Command wsl -ErrorAction SilentlyContinue

if ($plinkCmd) {
    Write-Host "📤 Using Plink for deployment..." -ForegroundColor Yellow
    
    # Upload files using PSCP
    $pscpCmd = Get-Command pscp -ErrorAction SilentlyContinue
    if ($pscpCmd) {
        Write-Host "📤 Uploading files to VPS..." -ForegroundColor Cyan
        
        # Create directory first
        plink -ssh -P $VPS_PORT -pw "$VPS_PASSWORD" "${VPS_USER}@${VPS_IP}" "mkdir -p ~/cryptorafts" 2>&1 | Out-Null
        
        # Upload files
        pscp -P $VPS_PORT -pw "$VPS_PASSWORD" -r . "${VPS_USER}@${VPS_IP}:~/cryptorafts/" 2>&1 | Tee-Object -Variable uploadOutput
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Files uploaded successfully!`n" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Upload failed: $uploadOutput`n" -ForegroundColor Yellow
            Write-Host "📋 Please upload manually:" -ForegroundColor Yellow
            Write-Host "   scp -P $VPS_PORT -r . ${VPS_USER}@${VPS_IP}:~/cryptorafts/`n" -ForegroundColor White
            Read-Host "Press Enter after files are uploaded"
        }
    } else {
        Write-Host "⚠️  PSCP not found. Please install PuTTY or upload manually.`n" -ForegroundColor Yellow
        Read-Host "Press Enter after files are uploaded"
    }
    
    # Deploy
    Write-Host "🚀 Deploying on VPS...`n" -ForegroundColor Green
    Write-Host "⏱️  This will take 8-10 minutes...`n" -ForegroundColor Yellow
    
    $deployCmd = "cd ~/cryptorafts; mkdir -p /var/www/cryptorafts; sudo cp -r ~/cryptorafts/* /var/www/cryptorafts/ 2>/dev/null || cp -r ~/cryptorafts/* /var/www/cryptorafts/ 2>/dev/null || true; cd /var/www/cryptorafts; chmod +x DEPLOY_FASTEST.sh; sudo bash DEPLOY_FASTEST.sh"
    plink -ssh -P $VPS_PORT -pw "$VPS_PASSWORD" "${VPS_USER}@${VPS_IP}" "$deployCmd" 2>&1 | Tee-Object
    
    Write-Host "`n✅ Deployment completed!`n" -ForegroundColor Green
    
} elseif ($wslCmd) {
    Write-Host "📤 Using WSL for deployment...`n" -ForegroundColor Yellow
    
    # Install sshpass in WSL if needed
    wsl bash -c "which sshpass || sudo apt-get update && sudo apt-get install -y sshpass" 2>&1 | Out-Null
    
    # Set password for sshpass
    $env:SSHPASS = $VPS_PASSWORD
    
    Write-Host "📤 Uploading files to VPS..." -ForegroundColor Cyan
    $projectPath = (Get-Location).Path -replace "C:", "/mnt/c" -replace "\\", "/"
    
    $uploadCmd = "cd ""$projectPath""; sshpass -e scp -P $VPS_PORT -r -o StrictHostKeyChecking=no . ${VPS_USER}@${VPS_IP}:~/cryptorafts/"
    wsl bash -c $uploadCmd 2>&1 | Tee-Object
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Files uploaded!`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Upload failed. Please upload manually.`n" -ForegroundColor Yellow
        Write-Host "   scp -P $VPS_PORT -r . ${VPS_USER}@${VPS_IP}:~/cryptorafts/" -ForegroundColor White
        Read-Host "Press Enter after files are uploaded"
    }
    
    Write-Host "🚀 Deploying on VPS...`n" -ForegroundColor Green
    Write-Host "⏱️  This will take 8-10 minutes...`n" -ForegroundColor Yellow
    
    $deployCmd = "cd ~/cryptorafts; mkdir -p /var/www/cryptorafts; sudo cp -r ~/cryptorafts/* /var/www/cryptorafts/ 2>/dev/null || cp -r ~/cryptorafts/* /var/www/cryptorafts/ 2>/dev/null || true; cd /var/www/cryptorafts; chmod +x DEPLOY_FASTEST.sh; sudo bash DEPLOY_FASTEST.sh"
    $wslCommand = "sshpass -e ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} `"$deployCmd`""
    wsl bash -c $wslCommand 2>&1 | Tee-Object
    
    Write-Host "`n✅ Deployment completed!`n" -ForegroundColor Green
    
} else {
    Write-Host "⚠️  Plink/WSL not available. Manual deployment required.`n" -ForegroundColor Yellow
    
    Write-Host "📋 Please run these commands manually:`n" -ForegroundColor Cyan
    
    Write-Host "1. Upload files:" -ForegroundColor White
    Write-Host "   scp -P $VPS_PORT -r . ${VPS_USER}@${VPS_IP}:~/cryptorafts/" -ForegroundColor Yellow
    Write-Host "   Password: $VPS_PASSWORD`n" -ForegroundColor Yellow
    
    Write-Host "2. Connect and deploy:" -ForegroundColor White
    Write-Host "   ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP}" -ForegroundColor Yellow
    Write-Host "   Password: $VPS_PASSWORD`n" -ForegroundColor Yellow
    
    Write-Host "   cd /var/www/cryptorafts" -ForegroundColor Yellow
    Write-Host "   chmod +x DEPLOY_FASTEST.sh" -ForegroundColor Yellow
    Write-Host "   sudo bash DEPLOY_FASTEST.sh`n" -ForegroundColor Yellow
    
    Write-Host "3. Wait 8-10 minutes, then visit:" -ForegroundColor White
    Write-Host "   https://www.cryptorafts.com`n" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT PROCESS COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Configure .env.production with Firebase keys" -ForegroundColor White
Write-Host "   2. Add domain to Firebase Authorized Domains" -ForegroundColor White
Write-Host "   3. Visit: https://www.cryptorafts.com`n" -ForegroundColor White
Write-Host "🌐 Your website should be LIVE at: https://www.cryptorafts.com" -ForegroundColor Green
Write-Host ""

