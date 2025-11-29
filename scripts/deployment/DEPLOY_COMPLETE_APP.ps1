# ============================================
# DEPLOY COMPLETE APP - AUTOMATIC
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"
$password = "Shamsi2627@@"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING COMPLETE APP" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Function to run SSH command with password
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Password
    )
    
    $plinkPath = "plink.exe"
    if (Test-Path $plinkPath) {
        # Use plink if available
        $echo = $password | & $plinkPath -ssh "${vpsUser}@${vpsIp}" -pw $password $Command 2>&1
        return $LASTEXITCODE -eq 0
    } else {
        # Use ssh with expect-like behavior
        Write-Host "Note: Using SSH with password prompt. Enter password when prompted." -ForegroundColor Yellow
        ssh "${vpsUser}@${vpsIp}" $Command
        return $LASTEXITCODE -eq 0
    }
}

# Function to upload file with password
function Invoke-SCPUpload {
    param(
        [string]$LocalFile,
        [string]$RemotePath,
        [string]$Password
    )
    
    $plinkPath = "plink.exe"
    $pscpPath = "pscp.exe"
    
    if (Test-Path $pscpPath) {
        # Use pscp if available
        $echo = $password | & $pscpPath -pw $password $LocalFile "${vpsUser}@${vpsIp}:${RemotePath}" 2>&1
        return $LASTEXITCODE -eq 0
    } else {
        # Use scp with password prompt
        Write-Host "Note: Using SCP with password prompt. Enter password when prompted." -ForegroundColor Yellow
        scp $LocalFile "${vpsUser}@${vpsIp}:${RemotePath}"
        return $LASTEXITCODE -eq 0
    }
}

# Upload all fixed files
Write-Host "[1/6] Uploading fixed SpotlightDisplay component..." -ForegroundColor Cyan
Invoke-SCPUpload "src/components/SpotlightDisplay.tsx" "${vpsPath}/src/components/SpotlightDisplay.tsx" $password
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SpotlightDisplay.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  Upload may have failed - check manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/6] Uploading fixed PerfectHeader component..." -ForegroundColor Cyan
Invoke-SCPUpload "src/components/PerfectHeader.tsx" "${vpsPath}/src/components/PerfectHeader.tsx" $password
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PerfectHeader.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  Upload may have failed - check manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/6] Uploading fixed SimpleAuthProvider..." -ForegroundColor Cyan
Invoke-SCPUpload "src/providers/SimpleAuthProvider.tsx" "${vpsPath}/src/providers/SimpleAuthProvider.tsx" $password
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SimpleAuthProvider.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  Upload may have failed - check manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/6] Uploading fixed page component..." -ForegroundColor Cyan
Invoke-SCPUpload "src/app/page.tsx" "${vpsPath}/src/app/page.tsx" $password
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ page.tsx uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  Upload may have failed - check manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/6] Rebuilding app..." -ForegroundColor Cyan
Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host "Enter password when prompted: $password" -ForegroundColor Yellow
Invoke-SSHCommand "cd ${vpsPath} && npm run build" $password
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build complete" -ForegroundColor Green
} else {
    Write-Host "⚠️  Build may have failed - check manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[6/6] Restarting app..." -ForegroundColor Cyan
Write-Host "Enter password when prompted: $password" -ForegroundColor Yellow
Invoke-SSHCommand "pm2 restart cryptorafts && sleep 3 && pm2 status" $password
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App restarted" -ForegroundColor Green
} else {
    Write-Host "⚠️  Restart may have failed - check manually" -ForegroundColor Yellow
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

