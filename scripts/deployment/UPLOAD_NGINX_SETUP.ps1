# ============================================
# UPLOAD NGINX SETUP SCRIPT TO VPS
# Uploads and runs nginx setup script
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/root"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UPLOADING NGINX SETUP SCRIPT TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload setup script
Write-Host "[1/2] Uploading nginx setup script..." -ForegroundColor Cyan
if (Test-Path "SETUP_NGINX_VPS.sh") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "SETUP_NGINX_VPS.sh" "${vpsUser}@${vpsIp}:${vpsPath}/SETUP_NGINX_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Setup script uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] SETUP_NGINX_VPS.sh not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Make executable and run
Write-Host "[2/2] Making executable and running setup..." -ForegroundColor Cyan
Write-Host "  This will configure nginx for www.cryptorafts.com" -ForegroundColor Yellow
Write-Host "  It will also install SSL certificate with Let's Encrypt" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Run this command on your VPS:" -ForegroundColor Cyan
Write-Host "    ssh root@72.61.98.99" -ForegroundColor White
Write-Host "    chmod +x SETUP_NGINX_VPS.sh" -ForegroundColor White
Write-Host "    sudo ./SETUP_NGINX_VPS.sh" -ForegroundColor White
Write-Host ""
Write-Host "  Or run directly:" -ForegroundColor Cyan
Write-Host "    ssh root@72.61.98.99 'chmod +x SETUP_NGINX_VPS.sh && sudo ./SETUP_NGINX_VPS.sh'" -ForegroundColor White
Write-Host ""

# Ask if user wants to run it now
$response = Read-Host "Do you want to run the setup script now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Running nginx setup script..." -ForegroundColor Cyan
    ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "chmod +x ${vpsPath}/SETUP_NGINX_VPS.sh && sudo ${vpsPath}/SETUP_NGINX_VPS.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "[OK] NGINX SETUP COMPLETE!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Your site should now be accessible at:" -ForegroundColor Cyan
        Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
        Write-Host "  https://cryptorafts.com" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "[WARN] Setup may have failed. Check output above." -ForegroundColor Yellow
        Write-Host "You can run manually:" -ForegroundColor Yellow
        Write-Host "  ssh root@72.61.98.99" -ForegroundColor White
        Write-Host "  sudo ./SETUP_NGINX_VPS.sh" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "Setup script uploaded. Run it manually on your VPS:" -ForegroundColor Yellow
    Write-Host "  ssh root@72.61.98.99" -ForegroundColor White
    Write-Host "  chmod +x SETUP_NGINX_VPS.sh" -ForegroundColor White
    Write-Host "  sudo ./SETUP_NGINX_VPS.sh" -ForegroundColor White
}

Write-Host ""

