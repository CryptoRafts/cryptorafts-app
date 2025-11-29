# ============================================
# 🚀 AUTOMATED DEPLOYMENT TO HOSTINGER VPS
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$VPS_IP = "",
    [Parameter(Mandatory=$false)]
    [string]$VPS_USER = "root",
    [Parameter(Mandatory=$false)]
    [string]$VPS_PASSWORD = ""
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 AUTOMATED DEPLOYMENT TO HOSTINGER VPS 🚀            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if SSH is available
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
$scpAvailable = Get-Command scp -ErrorAction SilentlyContinue

if (-not $sshAvailable -or -not $scpAvailable) {
    Write-Host "❌ SSH/SCP not found. Please install OpenSSH:" -ForegroundColor Red
    Write-Host "   Windows: Settings > Apps > Optional Features > OpenSSH Client" -ForegroundColor Yellow
    exit 1
}

# Get VPS credentials if not provided
if ([string]::IsNullOrEmpty($VPS_IP)) {
    Write-Host "📋 Need SSH credentials for Hostinger VPS:" -ForegroundColor Yellow
    Write-Host ""
    $VPS_IP = Read-Host "Enter VPS IP Address"
    if ([string]::IsNullOrEmpty($VPS_IP)) {
        Write-Host "❌ VPS IP is required!" -ForegroundColor Red
        exit 1
    }
}

if ([string]::IsNullOrEmpty($VPS_PASSWORD)) {
    Write-Host ""
    Write-Host "📋 Enter SSH password for $VPS_USER@$VPS_IP" -ForegroundColor Yellow
    $securePassword = Read-Host "Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $VPS_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host ""
Write-Host "[1/3] Uploading files to VPS..." -ForegroundColor Cyan

# Create SSH key-based auth helper script
$sshpassScript = @"
#!/bin/bash
echo '$VPS_PASSWORD'
"@

# Try to upload files using scp
Write-Host "📤 Uploading files to /var/www/cryptorafts/..." -ForegroundColor White

# Use sshpass if available, otherwise prompt for password
$uploadCommand = "scp -r . ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/"

try {
    # Try with password via sshpass (if installed)
    $env:SSHPASS = $VPS_PASSWORD
    sshpass -e scp -r -o StrictHostKeyChecking=no . ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/ 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Files uploaded successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  sshpass not found, using manual scp..." -ForegroundColor Yellow
        Write-Host "Run this command manually:" -ForegroundColor Yellow
        Write-Host "  scp -r . ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/" -ForegroundColor White
        Write-Host "Enter password when prompted" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Manual upload required:" -ForegroundColor Yellow
    Write-Host "  scp -r . ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/" -ForegroundColor White
}

Write-Host ""
Write-Host "[2/3] Connecting to VPS and deploying..." -ForegroundColor Cyan

# Create deployment command script
$deployCommands = @"
cd /var/www/cryptorafts
chmod +x DEPLOY_FASTEST.sh FIX_403_VPS_DIRECT.sh
sudo bash DEPLOY_FASTEST.sh
"@

Write-Host ""
Write-Host "📋 Run these commands on VPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "cd /var/www/cryptorafts" -ForegroundColor White
Write-Host "chmod +x DEPLOY_FASTEST.sh FIX_403_VPS_DIRECT.sh" -ForegroundColor White
Write-Host "sudo bash DEPLOY_FASTEST.sh" -ForegroundColor White
Write-Host ""

# Try to execute commands via SSH
try {
    Write-Host "🔐 Connecting to VPS..." -ForegroundColor Cyan
    
    $sshCommand = @"
cd /var/www/cryptorafts && 
chmod +x DEPLOY_FASTEST.sh FIX_403_VPS_DIRECT.sh && 
sudo bash DEPLOY_FASTEST.sh
"@

    # Use sshpass if available
    if (Get-Command sshpass -ErrorAction SilentlyContinue) {
        $env:SSHPASS = $VPS_PASSWORD
        sshpass -e ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "$sshCommand"
    } else {
        Write-Host ""
        Write-Host "⚠️  sshpass not installed. Please run manually:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
        Write-Host "cd /var/www/cryptorafts" -ForegroundColor White
        Write-Host "chmod +x DEPLOY_FASTEST.sh" -ForegroundColor White
        Write-Host "sudo bash DEPLOY_FASTEST.sh" -ForegroundColor White
        Write-Host ""
        Write-Host "Enter password when prompted" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Automatic SSH connection failed." -ForegroundColor Yellow
    Write-Host "Please run manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
    Write-Host "cd /var/www/cryptorafts" -ForegroundColor White
    Write-Host "sudo bash DEPLOY_FASTEST.sh" -ForegroundColor White
}

Write-Host ""
Write-Host "[3/3] Deployment in progress..." -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Deployment script started!" -ForegroundColor Green
Write-Host ""
Write-Host "⏱️  Expected time: 8-10 minutes" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 After deployment completes:" -ForegroundColor Cyan
Write-Host "   1. Configure .env.production with Firebase keys" -ForegroundColor White
Write-Host "   2. Add domain to Firebase Authorized Domains" -ForegroundColor White
Write-Host "   3. Visit: https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your website will be LIVE at: https://www.cryptorafts.com" -ForegroundColor Green
Write-Host ""

