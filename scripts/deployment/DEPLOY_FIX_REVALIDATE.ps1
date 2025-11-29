# PowerShell script to deploy fix for revalidate error
# Run this from your local machine

$VPS_IP = "72.61.98.99"
$VPS_USER = "root"
$VPS_PATH = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIX FOR REVALIDATE ERROR" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Upload fixed page.tsx
Write-Host "Step 1: Uploading fixed page.tsx..." -ForegroundColor Yellow
scp src/app/page.tsx ${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/app/page.tsx
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload page.tsx" -ForegroundColor Red
    exit 1
}
Write-Host "✅ page.tsx uploaded" -ForegroundColor Green
Write-Host ""

# 2. Upload fix script
Write-Host "Step 2: Uploading fix script..." -ForegroundColor Yellow
scp FIX_REVALIDATE_ERROR.sh ${VPS_USER}@${VPS_IP}:${VPS_PATH}/FIX_REVALIDATE_ERROR.sh
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload fix script" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Fix script uploaded" -ForegroundColor Green
Write-Host ""

# 3. Run fix script on VPS
Write-Host "Step 3: Running fix script on VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd ${VPS_PATH} && chmod +x FIX_REVALIDATE_ERROR.sh && bash FIX_REVALIDATE_ERROR.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fix script failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Fix script completed" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test localhost: http://localhost:3000" -ForegroundColor White
Write-Host "2. Test VPS: https://www.cryptorafts.com" -ForegroundColor White
Write-Host "3. Check browser console for errors" -ForegroundColor White
Write-Host "4. Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host ""

