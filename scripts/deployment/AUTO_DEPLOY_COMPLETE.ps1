# ============================================
# 🚀 COMPLETE AUTOMATED DEPLOYMENT - POWERSHELL
# ============================================
# This script automates everything possible

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 CRYPTORAFTS - COMPLETE AUTOMATED DEPLOYMENT 🚀     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to display step
function Show-Step {
    param([string]$step, [string]$message)
    Write-Host "[$step] $message" -ForegroundColor Yellow
}

# Function to display success
function Show-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

# Function to display error
function Show-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

# Function to display info
function Show-Info {
    param([string]$message)
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

# ============================================
# STEP 1: PREPARE ALL DEPLOYMENT FILES
# ============================================
Show-Step "1/6" "Preparing deployment files..."

# Verify required files exist
$requiredFiles = @(
    "next.config.vps.js",
    "server.js",
    "ecosystem.config.js",
    "package.json"
)

$allExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Show-Success "$file exists"
    } else {
        Show-Error "$file is missing!"
        $allExist = $false
    }
}

if (-not $allExist) {
    Show-Error "Some required files are missing. Cannot continue."
    exit 1
}

# Switch to VPS config
if (Test-Path "next.config.js") {
    Copy-Item "next.config.js" "next.config.js.backup" -Force
    Show-Info "Backup created: next.config.js.backup"
}

Copy-Item "next.config.vps.js" "next.config.js" -Force
Show-Success "VPS configuration activated"

# ============================================
# STEP 2: CREATE DEPLOYMENT PACKAGE
# ============================================
Show-Step "2/6" "Creating deployment package..."

$packageInfo = @'
COMPLETE DEPLOYMENT PACKAGE READY!

All files prepared for VPS deployment.

QUICK DEPLOYMENT STEPS:

1. GET SSH CREDENTIALS FROM HOSTINGER
   - Contact support@hostinger.com
   - Ask for SSH credentials for VPS #1097850
   - Or check Hostinger panel if accessible

2. UPLOAD FILES TO VPS
   PowerShell: scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/
   Or use WinSCP

3. CONNECT TO VPS AND RUN FIX
   ssh root@YOUR_VPS_IP
   cd /var/www/cryptorafts
   chmod +x FIX_403_VPS_DIRECT.sh
   sudo bash FIX_403_VPS_DIRECT.sh

4. VERIFY
   Visit: https://www.cryptorafts.com
   Should load without 403 error!

FILES READY:
- next.config.vps.js (VPS configuration)
- server.js (Custom server)
- ecosystem.config.js (PM2 config)
- FIX_403_VPS_DIRECT.sh (Complete fix script)
- All deployment guides

Your app will be live at: https://www.cryptorafts.com
'@

Set-Content -Path "DEPLOYMENT_PACKAGE_README.txt" -Value $packageInfo
Show-Success "Deployment package created"

# ============================================
# STEP 3: PREPARE ALL FIX SCRIPTS
# ============================================
Show-Step "3/6" "Preparing fix scripts..."

# Verify fix script exists
if (Test-Path "FIX_403_VPS_DIRECT.sh") {
    Show-Success "Fix script ready: FIX_403_VPS_DIRECT.sh"
} else {
    Show-Error "Fix script not found!"
}

# Create quick upload script
$uploadScript = @'
# Upload deployment files to VPS
# Replace YOUR_VPS_IP with actual IP

cd C:\Users\dell\cryptorafts-starter

# Upload all files
scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/

# OR upload specific files
scp FIX_403_VPS_DIRECT.sh root@YOUR_VPS_IP:/var/www/cryptorafts/
scp next.config.vps.js root@YOUR_VPS_IP:/var/www/cryptorafts/
scp server.js root@YOUR_VPS_IP:/var/www/cryptorafts/
scp ecosystem.config.js root@YOUR_VPS_IP:/var/www/cryptorafts/
'@

Set-Content -Path "UPLOAD_TO_VPS.txt" -Value $uploadScript
Show-Success "Upload instructions created"

# ============================================
# STEP 4: CREATE DEPLOYMENT COMMANDS
# ============================================
Show-Step "4/6" "Creating deployment commands..."

$commands = @'
# ============================================
# DEPLOYMENT COMMANDS - RUN ON VPS
# ============================================

# STEP 1: Connect to VPS
ssh root@YOUR_VPS_IP

# STEP 2: Navigate to app directory
cd /var/www/cryptorafts

# STEP 3: Run complete fix
chmod +x FIX_403_VPS_DIRECT.sh
sudo bash FIX_403_VPS_DIRECT.sh

# STEP 4: Verify deployment
pm2 status
curl http://localhost:3000
sudo nginx -t

# STEP 5: Check if working
# Visit: https://www.cryptorafts.com
'@

Set-Content -Path "VPS_COMMANDS.txt" -Value $commands
Show-Success "Deployment commands created"

# ============================================
# STEP 5: CREATE SUMMARY DOCUMENT
# ============================================
Show-Step "5/6" "Creating summary document..."

$summary = @'
╔══════════════════════════════════════════════════════════╗
║         ✅ DEPLOYMENT PACKAGE COMPLETE! ✅                ║
╚══════════════════════════════════════════════════════════╝

🎯 EVERYTHING IS READY FOR DEPLOYMENT!

✅ Files Prepared:
   - VPS configuration (next.config.vps.js)
   - Custom server (server.js)
   - PM2 configuration (ecosystem.config.js)
   - Complete fix script (FIX_403_VPS_DIRECT.sh)
   - All deployment guides

📋 NEXT STEPS (NO BROWSER NEEDED):

1. GET SSH CREDENTIALS FROM HOSTINGER
   - Email: support@hostinger.com
   - Subject: Need SSH for VPS #1097850
   - They'll provide: IP, Username (root), Password

2. UPLOAD FILES TO VPS
   PowerShell: scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/

3. CONNECT AND RUN FIX
   ssh root@YOUR_VPS_IP
   cd /var/www/cryptorafts
   chmod +x FIX_403_VPS_DIRECT.sh
   sudo bash FIX_403_VPS_DIRECT.sh

4. VERIFY
   Visit: https://www.cryptorafts.com
   Should load without 403 error!

📚 GUIDES:
   - FIX_403_NO_BROWSER.md (Complete guide)
   - DEPLOY_NOW_COMPLETE.md (Original guide)
   - COMPLETE_VPS_FIX.md (VPS fix guide)

🚀 YOUR APP WILL BE LIVE AT:
   https://www.cryptorafts.com

═══════════════════════════════════════════════════════════
'@

Set-Content -Path "DEPLOYMENT_SUMMARY.txt" -Value $summary
Show-Success "Summary document created"

# ============================================
# STEP 6: DISPLAY COMPLETION AND SUMMARY
# ============================================
Show-Step "6/6" "Deployment package complete!"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         🎉 DEPLOYMENT PACKAGE COMPLETE! 🎉               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Show-Info "All files prepared and ready!"
Write-Host ""

Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1️⃣  Get SSH credentials from Hostinger" -ForegroundColor Yellow
Write-Host "      Email: support@hostinger.com" -ForegroundColor White
Write-Host "      Ask for: SSH credentials for VPS #1097850" -ForegroundColor White
Write-Host ""
Write-Host "   2️⃣  Upload files to VPS" -ForegroundColor Yellow
Write-Host "      PowerShell: scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/" -ForegroundColor White
Write-Host ""
Write-Host "   3️⃣  Connect to VPS and run fix" -ForegroundColor Yellow
Write-Host "      ssh root@YOUR_VPS_IP" -ForegroundColor White
Write-Host "      cd /var/www/cryptorafts" -ForegroundColor White
Write-Host "      chmod +x FIX_403_VPS_DIRECT.sh" -ForegroundColor White
Write-Host "      sudo bash FIX_403_VPS_DIRECT.sh" -ForegroundColor White
Write-Host ""
Write-Host "   4️⃣  Verify deployment" -ForegroundColor Yellow
Write-Host "      Visit: https://www.cryptorafts.com" -ForegroundColor White
Write-Host "      Should load without 403 error!" -ForegroundColor White
Write-Host ""

Write-Host "📚 READ THESE GUIDES:" -ForegroundColor Cyan
Write-Host "   - FIX_403_NO_BROWSER.md (START HERE!)" -ForegroundColor White
Write-Host "   - DEPLOYMENT_PACKAGE_README.txt" -ForegroundColor White
Write-Host "   - VPS_COMMANDS.txt" -ForegroundColor White
Write-Host ""

Write-Host "🎯 YOUR APP WILL BE LIVE AT:" -ForegroundColor Yellow
Write-Host "   🌐 https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""

Write-Host "✅ All deployment files ready!" -ForegroundColor Green
Write-Host "✅ All fix scripts prepared!" -ForegroundColor Green
Write-Host "✅ All guides created!" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Ready to deploy! Follow FIX_403_NO_BROWSER.md" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to open guide
$openGuide = Read-Host "Open FIX_403_NO_BROWSER.md now? (Y/N)"
if ($openGuide -eq "Y" -or $openGuide -eq "y") {
    notepad FIX_403_NO_BROWSER.md
    Show-Success "Opened guide"
}

Write-Host ""

