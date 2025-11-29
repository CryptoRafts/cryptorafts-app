# ============================================
# CRYPTORAFTS - AUTOMATED DEPLOYMENT
# ============================================

Write-Host "`n🚀 CRYPTORAFTS - AUTOMATED DEPLOYMENT WITH AUTO-FIX" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$vpsIP = "72.61.98.99"
$vpsUser = "root"

Write-Host "📋 Uploading deployment script to VPS..." -ForegroundColor Yellow

# Upload the bash script to VPS
$scpResult = & scp AUTO_DEPLOY_COMPLETE.sh ${vpsUser}@${vpsIP}:/tmp/deploy.sh 2>&1

if ($LASTEXITCODE -eq 0 -or $scpResult -match "success") {
    Write-Host "✅ Script uploaded successfully" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📋 Executing deployment on VPS..." -ForegroundColor Yellow
    Write-Host "⚠️  This will take 5-10 minutes. Errors will be auto-fixed in real-time." -ForegroundColor Yellow
    Write-Host ""
    
    # Execute the script on VPS - use separate commands
    $chmodCmd = "chmod +x /tmp/deploy.sh"
    $bashCmd = "bash /tmp/deploy.sh"
    $sshCmd = "$chmodCmd; $bashCmd"
    
    ssh ${vpsUser}@${vpsIP} $sshCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Automated deployment completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Your app is now live at: https://www.cryptorafts.com" -ForegroundColor Cyan
    } else {
        Write-Host "`n⚠️  Deployment completed with warnings. Check output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n❌ Failed to upload script via SCP." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Copy AUTO_DEPLOY_COMPLETE.sh to your VPS manually and run:" -ForegroundColor Yellow
    Write-Host "   chmod +x AUTO_DEPLOY_COMPLETE.sh" -ForegroundColor White
    Write-Host "   bash AUTO_DEPLOY_COMPLETE.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "OR if you're already connected via SSH, run:" -ForegroundColor Yellow
    Write-Host "   cat > /tmp/deploy.sh << 'EOF'" -ForegroundColor White
    Write-Host "   [paste contents of AUTO_DEPLOY_COMPLETE.sh]" -ForegroundColor White
    Write-Host "   EOF" -ForegroundColor White
    Write-Host "   chmod +x /tmp/deploy.sh" -ForegroundColor White
    Write-Host "   bash /tmp/deploy.sh" -ForegroundColor White
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT SCRIPT READY!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan
