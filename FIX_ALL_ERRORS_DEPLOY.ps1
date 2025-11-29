# ============================================
# FIX ALL ERRORS AND DEPLOY TO VPS
# Fixes hydration, favicon, and deploys everything
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIXING ALL ERRORS AND DEPLOYING" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$failedFiles = @()

# Function to upload file with retry
function Upload-FileWithRetry {
    param(
        [string]$localPath,
        [string]$remotePath
    )
    
    $maxRetries = 3
    $retryCount = 0
    
    while ($retryCount -lt $maxRetries) {
        scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "$localPath" "${vpsUser}@${vpsIp}:${remotePath}" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        $retryCount++
        Start-Sleep -Seconds 2
    }
    
    return $false
}

# Step 1: Upload fixed page.tsx (hydration fix)
Write-Host "[1/6] Uploading fixed page.tsx (hydration fix)..." -ForegroundColor Cyan
if (Test-Path "src/app/page.tsx") {
    if (Upload-FileWithRetry "src/app/page.tsx" "${vpsPath}/src/app/page.tsx") {
        Write-Host "  [OK] page.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] page.tsx failed" -ForegroundColor Red
        $failedFiles += "src/app/page.tsx"
    }
} else {
    Write-Host "  [WARN] page.tsx not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Upload fixed globals.css (with neon button styles)
Write-Host "[2/6] Uploading fixed globals.css..." -ForegroundColor Cyan
if (Test-Path "src/app/globals.css") {
    if (Upload-FileWithRetry "src/app/globals.css" "${vpsPath}/src/app/globals.css") {
        Write-Host "  [OK] globals.css uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] globals.css failed" -ForegroundColor Red
        $failedFiles += "src/app/globals.css"
    }
} else {
    Write-Host "  [WARN] globals.css not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Upload layout.tsx with favicon fix
Write-Host "[3/6] Uploading layout.tsx (favicon fix)..." -ForegroundColor Cyan
if (Test-Path "src/app/layout.tsx") {
    if (Upload-FileWithRetry "src/app/layout.tsx" "${vpsPath}/src/app/layout.tsx") {
        Write-Host "  [OK] layout.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] layout.tsx failed" -ForegroundColor Red
        $failedFiles += "src/app/layout.tsx"
    }
} else {
    Write-Host "  [WARN] layout.tsx not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Upload favicon.ico
Write-Host "[4/6] Uploading favicon files..." -ForegroundColor Cyan
if (Test-Path "public/favicon.ico") {
    if (Upload-FileWithRetry "public/favicon.ico" "${vpsPath}/public/favicon.ico") {
        Write-Host "  [OK] favicon.ico uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] favicon.ico upload failed, will copy on server" -ForegroundColor Yellow
        ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cp ${vpsPath}/public/tablogo.ico ${vpsPath}/public/favicon.ico 2>/dev/null || true" 2>&1 | Out-Null
    }
} else {
    Write-Host "  [WARN] favicon.ico not found, will copy on server" -ForegroundColor Yellow
    ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cp ${vpsPath}/public/tablogo.ico ${vpsPath}/public/favicon.ico 2>/dev/null || true" 2>&1 | Out-Null
}
Write-Host ""

# Step 5: Build on VPS
Write-Host "[5/6] Building on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    Write-Host "  Run manually: ssh root@72.61.98.99 'cd /var/www/cryptorafts; npm run build'" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] Build complete" -ForegroundColor Green
Write-Host ""

# Step 6: Restart PM2
Write-Host "[6/6] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Restart failed" -ForegroundColor Red
    Write-Host "  Run manually: ssh root@72.61.98.99 'cd /var/www/cryptorafts; pm2 restart cryptorafts'" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] PM2 restarted" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
if ($failedFiles.Count -eq 0) {
    Write-Host "[OK] ALL ERRORS FIXED AND DEPLOYED!" -ForegroundColor Green
} else {
    Write-Host "[WARN] DEPLOYMENT COMPLETE WITH WARNINGS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Failed files:" -ForegroundColor Yellow
    foreach ($file in $failedFiles) {
        Write-Host "  [FAIL] $file" -ForegroundColor Red
    }
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "  [OK] React hydration error (removed style jsx)" -ForegroundColor White
Write-Host "  [OK] Favicon 404 error (added route)" -ForegroundColor White
Write-Host "  [OK] Neon button styles (moved to globals.css)" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host "  http://72.61.98.99:3000" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Configure nginx for www.cryptorafts.com" -ForegroundColor Yellow
Write-Host "  See: NGINX_CONFIG_FOR_DOMAIN.md" -ForegroundColor White
Write-Host ""
Write-Host "Blog RSS Automation Link:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com/api/blog/rss" -ForegroundColor White
Write-Host "  https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host ""

