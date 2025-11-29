# PowerShell Script to Upload All Fixed Files to VPS
# Run this script from PowerShell

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UPLOAD ALL FIXED FILES TO VPS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration - SET YOUR VPS DETAILS HERE
$VPS_IP = Read-Host "Enter your VPS IP address or domain name"
$VPS_USER = Read-Host "Enter your VPS username (default: root)"
if ([string]::IsNullOrWhiteSpace($VPS_USER)) { $VPS_USER = "root" }

$VPS_DIR = "/var/www/cryptorafts"
$LOCAL_DIR = Get-Location

Write-Host ""
Write-Host "VPS IP: $VPS_IP" -ForegroundColor Green
Write-Host "VPS User: $VPS_USER" -ForegroundColor Green
Write-Host "VPS Directory: $VPS_DIR" -ForegroundColor Green
Write-Host "Local Directory: $LOCAL_DIR" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Continue with upload? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Upload cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Uploading files..." -ForegroundColor Yellow
Write-Host ""

# Check if SCP is available
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: SCP not found!" -ForegroundColor Red
    Write-Host "Please install OpenSSH or use Hostinger hPanel File Manager to upload files." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Files to upload manually:" -ForegroundColor Yellow
    Write-Host "  1. src\app\page.tsx → $VPS_DIR/src/app/page.tsx" -ForegroundColor White
    Write-Host "  2. src\app\HomePageClient.tsx → $VPS_DIR/src/app/HomePageClient.tsx" -ForegroundColor White
    Write-Host "  3. src\components\PerfectHeader.tsx → $VPS_DIR/src/components/PerfectHeader.tsx" -ForegroundColor White
    Write-Host "  4. FINAL_DEPLOYMENT_COMPLETE.sh → $VPS_DIR/" -ForegroundColor White
    Write-Host "  5. NGINX_CONFIG_CHECK.sh → $VPS_DIR/" -ForegroundColor White
    Write-Host "  6. COMPREHENSIVE_VPS_DIAGNOSTIC.sh → $VPS_DIR/" -ForegroundColor White
    exit
}

# Upload fixed source files
Write-Host "1. Uploading src/app/page.tsx..." -ForegroundColor Cyan
scp "src\app\page.tsx" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/app/page.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ page.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload page.tsx" -ForegroundColor Red
}

Write-Host "2. Uploading src/app/HomePageClient.tsx..." -ForegroundColor Cyan
scp "src\app\HomePageClient.tsx" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/app/HomePageClient.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ HomePageClient.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload HomePageClient.tsx" -ForegroundColor Red
}

Write-Host "3. Uploading src/components/PerfectHeader.tsx..." -ForegroundColor Cyan
scp "src\components\PerfectHeader.tsx" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/components/PerfectHeader.tsx"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ PerfectHeader.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload PerfectHeader.tsx" -ForegroundColor Red
}

# Upload deployment scripts
Write-Host "4. Uploading deployment scripts..." -ForegroundColor Cyan
scp "FINAL_DEPLOYMENT_COMPLETE.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"
scp "NGINX_CONFIG_CHECK.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"
scp "COMPREHENSIVE_VPS_DIAGNOSTIC.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Deployment scripts uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload scripts" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FILES UPLOADED SUCCESSFULLY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. SSH into VPS: ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "2. Run deployment: cd ${VPS_DIR} && chmod +x *.sh && ./FINAL_DEPLOYMENT_COMPLETE.sh" -ForegroundColor White
Write-Host ""
