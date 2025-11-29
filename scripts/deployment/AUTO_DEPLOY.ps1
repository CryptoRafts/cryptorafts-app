# Auto Deploy Script - Run this from your local machine
$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"
$localFile = "src/app/page.tsx"
$remoteFile = "$vpsPath/src/app/page.tsx"

Write-Host "🚀 Starting deployment..." -ForegroundColor Green
Write-Host ""

Write-Host "📤 Step 1: Uploading fixed page.tsx..." -ForegroundColor Yellow
scp $localFile "${vpsUser}@${vpsIp}:${remoteFile}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ File uploaded successfully!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔨 Step 2: Rebuilding application on VPS..." -ForegroundColor Yellow
    ssh "${vpsUser}@${vpsIp}" "cd $vpsPath && npm run build 2>&1 | tail -20"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Build successful!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "🔄 Step 3: Restarting PM2..." -ForegroundColor Yellow
        ssh "${vpsUser}@${vpsIp}" "cd $vpsPath && pm2 restart cryptorafts --update-env"
        
        Write-Host ""
        Write-Host "📊 Step 4: Checking PM2 status..." -ForegroundColor Yellow
        ssh "${vpsUser}@${vpsIp}" "pm2 status"
        
        Write-Host ""
        Write-Host "📝 Step 5: Recent logs:" -ForegroundColor Yellow
        ssh "${vpsUser}@${vpsIp}" "pm2 logs cryptorafts --lines 10 --nostream"
        
        Write-Host ""
        Write-Host "✅✅✅ DEPLOYMENT COMPLETE! ✅✅✅" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
        Write-Host "   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)" -ForegroundColor White
        Write-Host "   - Or open a new Incognito/Private window" -ForegroundColor White
        Write-Host "   - Visit: https://www.cryptorafts.com" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Build failed! Check the errors above." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "❌ File upload failed! Check your SSH connection." -ForegroundColor Red
}
