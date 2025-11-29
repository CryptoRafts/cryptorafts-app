# ============================================
# FINAL DEPLOYMENT - Upload and Verify
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FINAL DEPLOYMENT" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Upload all fixed files
$files = @(
    "src/components/SpotlightDisplay.tsx",
    "src/components/PerfectHeader.tsx",
    "src/providers/SimpleAuthProvider.tsx",
    "src/app/page.tsx"
)

$fileCount = 0
foreach ($file in $files) {
    $fileCount++
    $remotePath = $file.Replace("src/", "${vpsPath}/src/")
    Write-Host "[$fileCount/$($files.Count)] Uploading $file..." -ForegroundColor Cyan
    Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
    scp $file "${vpsUser}@${vpsIp}:${remotePath}"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed - run manually: scp $file ${vpsUser}@${vpsIp}:${remotePath}" -ForegroundColor Red
    }
    Write-Host ""
}

# Upload verification script
Write-Host "[$($files.Count + 1)/$($files.Count + 2)] Uploading verification script..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp VERIFY_DEPLOYMENT.sh "${vpsUser}@${vpsIp}:/root/VERIFY_DEPLOYMENT.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed" -ForegroundColor Red
}
Write-Host ""

# Rebuild and verify
Write-Host "[$($files.Count + 2)/$($files.Count + 2)] Rebuilding and verifying..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && npm run build && pm2 restart cryptorafts && sleep 3 && chmod +x /root/VERIFY_DEPLOYMENT.sh && /root/VERIFY_DEPLOYMENT.sh"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Deployment complete" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Deployment may have issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Refresh your browser (Ctrl+Shift+R) to see changes." -ForegroundColor White
Write-Host ""

