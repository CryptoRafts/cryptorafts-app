# ============================================
# CRYPTORAFTS - VERIFY SERVER
# Checks server status and fixes issues
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - VERIFY SERVER" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Uploading verification script..." -ForegroundColor Yellow

# Upload verification script
if (Test-Path "VERIFY_AND_FIX_SERVER.sh") {
    Write-Host "Uploading VERIFY_AND_FIX_SERVER.sh..." -ForegroundColor Cyan
    scp VERIFY_AND_FIX_SERVER.sh "${vpsUser}@${vpsIP}:${appDir}/VERIFY_AND_FIX_SERVER.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Verification script uploaded" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to upload verification script" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 2: Running verification..." -ForegroundColor Yellow
Write-Host "Connecting to: $vpsUser@$vpsIP" -ForegroundColor Cyan
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

# Execute verification
ssh "${vpsUser}@${vpsIP}" "cd ${appDir} && chmod +x VERIFY_AND_FIX_SERVER.sh && bash VERIFY_AND_FIX_SERVER.sh"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

