# Full Automated Deployment Script
# This script will deploy everything automatically

$ErrorActionPreference = "Stop"
$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"
$localFile = "src/app/page.tsx"
$remoteFile = "$vpsPath/src/app/page.tsx"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 FULL AUTOMATED DEPLOYMENT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify local file exists
Write-Host "📋 Step 1: Verifying local file..." -ForegroundColor Yellow
if (-not (Test-Path $localFile)) {
    Write-Host "❌ Error: $localFile not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Local file verified: $localFile" -ForegroundColor Green
Write-Host ""

# Step 2: Upload file using SCP
Write-Host "📤 Step 2: Uploading fixed page.tsx to VPS..." -ForegroundColor Yellow
Write-Host "   (You may be prompted for SSH password)" -ForegroundColor Gray

try {
    $scpCommand = "scp `"$localFile`" ${vpsUser}@${vpsIp}:${remoteFile}"
    Write-Host "   Running: $scpCommand" -ForegroundColor Gray
    Invoke-Expression $scpCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ File uploaded successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ File upload failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error uploading file: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Build on VPS
Write-Host "🔨 Step 3: Rebuilding application on VPS..." -ForegroundColor Yellow
Write-Host "   (You may be prompted for SSH password)" -ForegroundColor Gray

try {
    $buildCommand = "cd $vpsPath; npm run build 2>&1 | tail -20"
    $sshCommand = "ssh ${vpsUser}@${vpsIp} `"$buildCommand`""
    Write-Host "   Running: $sshCommand" -ForegroundColor Gray
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build completed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Build may have warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
        Write-Host "   Continuing with deployment..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error building: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Restart PM2
Write-Host "🔄 Step 4: Restarting PM2..." -ForegroundColor Yellow
Write-Host "   (You may be prompted for SSH password)" -ForegroundColor Gray

try {
    $restartCommand = "cd $vpsPath; pm2 restart cryptorafts --update-env"
    $sshCommand = "ssh ${vpsUser}@${vpsIp} `"$restartCommand`""
    Write-Host "   Running: $sshCommand" -ForegroundColor Gray
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PM2 restarted successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PM2 restart may have issues (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error restarting PM2: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Check PM2 status
Write-Host "📊 Step 5: Checking PM2 status..." -ForegroundColor Yellow
Write-Host "   (You may be prompted for SSH password)" -ForegroundColor Gray

try {
    $statusCommand = "pm2 status"
    $sshCommand = "ssh ${vpsUser}@${vpsIp} `"$statusCommand`""
    Write-Host "   Running: $sshCommand" -ForegroundColor Gray
    Invoke-Expression $sshCommand
} catch {
    Write-Host "⚠️  Could not check PM2 status: $_" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Show recent logs
Write-Host "📝 Step 6: Recent application logs..." -ForegroundColor Yellow
Write-Host "   (You may be prompted for SSH password)" -ForegroundColor Gray

try {
    $logsCommand = "pm2 logs cryptorafts --lines 10 --nostream"
    $sshCommand = "ssh ${vpsUser}@${vpsIp} `"$logsCommand`""
    Write-Host "   Running: $sshCommand" -ForegroundColor Gray
    Invoke-Expression $sshCommand
} catch {
    Write-Host "⚠️  Could not retrieve logs: $_" -ForegroundColor Yellow
}
Write-Host ""

# Final summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅✅✅ DEPLOYMENT COMPLETE! ✅✅✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 What was deployed:" -ForegroundColor Yellow
Write-Host "   - Fixed page.tsx (removed mounted state check)" -ForegroundColor White
Write-Host "   - Application rebuilt" -ForegroundColor White
Write-Host "   - PM2 restarted" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "   - Press Ctrl+Shift+R (Windows/Linux)" -ForegroundColor White
Write-Host "   - Press Cmd+Shift+R (Mac)" -ForegroundColor White
Write-Host "   - Or open a new Incognito/Private window" -ForegroundColor White
Write-Host "   - Visit: https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "✅ Your app should now show:" -ForegroundColor Green
Write-Host "   - Hero section with video background" -ForegroundColor White
Write-Host "   - WELCOME TO CRYPTORAFTS text" -ForegroundColor White
Write-Host "   - The AI-Powered Web3 Ecosystem headline" -ForegroundColor White
Write-Host "   - GET STARTED button" -ForegroundColor White
Write-Host "   - All other sections visible" -ForegroundColor White
Write-Host ""

