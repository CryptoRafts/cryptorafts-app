# ============================================
# UPLOAD FIXES AND DEPLOY - AUTOMATIC
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "UPLOADING FIXES AND DEPLOYING" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host "Enter password when prompted for each command." -ForegroundColor Yellow
Write-Host ""

# Upload all fixed files
$files = @(
    @{Local="src/components/SpotlightDisplay.tsx"; Remote="${vpsPath}/src/components/SpotlightDisplay.tsx"},
    @{Local="src/components/PerfectHeader.tsx"; Remote="${vpsPath}/src/components/PerfectHeader.tsx"},
    @{Local="src/providers/SimpleAuthProvider.tsx"; Remote="${vpsPath}/src/providers/SimpleAuthProvider.tsx"},
    @{Local="src/app/page.tsx"; Remote="${vpsPath}/src/app/page.tsx"},
    @{Local="COMPLETE_DEPLOY_VPS.sh"; Remote="/root/COMPLETE_DEPLOY_VPS.sh"}
)

$fileCount = 0
foreach ($file in $files) {
    $fileCount++
    Write-Host "[$fileCount/$($files.Count)] Uploading $($file.Local)..." -ForegroundColor Cyan
    Write-Host "Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
    scp $file.Local "${vpsUser}@${vpsIp}:$($file.Remote)"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $($file.Local) uploaded" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to upload $($file.Local)" -ForegroundColor Red
        Write-Host "Please run manually: scp $($file.Local) ${vpsUser}@${vpsIp}:$($file.Remote)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Run deployment script on VPS
Write-Host "[$($files.Count + 1)/$($files.Count + 1)] Running deployment script on VPS..." -ForegroundColor Cyan
Write-Host "Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/COMPLETE_DEPLOY_VPS.sh && /root/COMPLETE_DEPLOY_VPS.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment complete" -ForegroundColor Green
} else {
    Write-Host "⚠️  Deployment may have issues - check manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app should now be working at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host "  http://72.61.98.99:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Refresh your browser (Ctrl+Shift+R) to see the changes." -ForegroundColor White
Write-Host ""
