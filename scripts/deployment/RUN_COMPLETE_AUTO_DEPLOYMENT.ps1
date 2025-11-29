# ==========================================
# COMPLETE AUTO DEPLOYMENT - EVERYTHING
# ==========================================
# This script uploads and runs the complete
# auto deployment script on the VPS
# ==========================================

$VPS_IP = "72.61.98.99"
$VPS_USER = "root"
$VPS_APP_DIR = "/var/www/cryptorafts"
$SCRIPT_NAME = "COMPLETE_AUTO_DEPLOYMENT.sh"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "COMPLETE AUTO DEPLOYMENT - EVERYTHING" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if script exists
if (-not (Test-Path $SCRIPT_NAME)) {
    Write-Host "❌ Error: $SCRIPT_NAME not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found complete auto deployment script: $SCRIPT_NAME" -ForegroundColor Green
Write-Host ""

# Step 2: Upload script to VPS
Write-Host "Step 1: Uploading complete auto deployment script to VPS..." -ForegroundColor Yellow
Write-Host "Please enter VPS password when prompted..." -ForegroundColor Yellow
Write-Host ""

scp $SCRIPT_NAME "${VPS_USER}@${VPS_IP}:${VPS_APP_DIR}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Script uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload script" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Run script on VPS
Write-Host "Step 2: Running complete auto deployment on VPS..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor White
Write-Host "  - Fix Nginx configuration" -ForegroundColor White
Write-Host "  - Fix symlink issues" -ForegroundColor White
Write-Host "  - Ensure PM2 is running" -ForegroundColor White
Write-Host "  - Verify port 3000 is listening" -ForegroundColor White
Write-Host "  - Test everything" -ForegroundColor White
Write-Host ""
Write-Host "Please enter VPS password when prompted..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_APP_DIR} && chmod +x ${SCRIPT_NAME} && bash ${SCRIPT_NAME}"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Complete auto deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Test website: http://www.cryptorafts.com" -ForegroundColor White
    Write-Host "2. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
    Write-Host "3. Test in Incognito window" -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Complete auto deployment failed. Check output above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check PM2 logs: ssh root@${VPS_IP} 'pm2 logs cryptorafts --lines 50'" -ForegroundColor White
    Write-Host "2. Check Nginx logs: ssh root@${VPS_IP} 'tail -f /var/log/nginx/error.log'" -ForegroundColor White
    Write-Host "3. Check Nginx config: ssh root@${VPS_IP} 'sudo nginx -t'" -ForegroundColor White
    Write-Host "4. Check if port 3000 is listening: ssh root@${VPS_IP} 'netstat -tuln | grep 3000'" -ForegroundColor White
    exit 1
}

