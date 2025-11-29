# ============================================
# DEPLOY FIXED BUILD TO VPS - IMPROVED VERSION
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"
$localPath = "C:\Users\dell\cryptorafts-starter"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIXED BUILD TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build locally
Write-Host "[1/5] Building Next.js app locally..." -ForegroundColor Cyan
Set-Location $localPath
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Upload files one by one with retries
Write-Host "[2/5] Uploading fixed files to VPS..." -ForegroundColor Cyan

# Function to upload with retry
function Upload-FileWithRetry {
    param(
        [string]$LocalFile,
        [string]$RemotePath,
        [string]$Description
    )
    
    $maxRetries = 3
    $retryCount = 0
    
    while ($retryCount -lt $maxRetries) {
        Write-Host "  Uploading $Description (attempt $($retryCount + 1)/$maxRetries)..." -ForegroundColor Yellow
        scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "$LocalFile" "${vpsUser}@${vpsIp}:$RemotePath"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Uploaded $Description" -ForegroundColor Green
            return $true
        }
        
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "    ⚠ Retrying in 5 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
    
    Write-Host "    ✗ Failed to upload $Description after $maxRetries attempts" -ForegroundColor Red
    return $false
}

# Upload page.tsx
if (-not (Upload-FileWithRetry "src/app/page.tsx" "$vpsPath/src/app/page.tsx" "page.tsx")) {
    exit 1
}

# Upload globals.css
if (-not (Upload-FileWithRetry "src/app/globals.css" "$vpsPath/src/app/globals.css" "globals.css")) {
    exit 1
}

Write-Host ""
Write-Host "  ✓ All files uploaded successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Rebuild on VPS
Write-Host "[3/5] Rebuilding on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed on VPS" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build complete on VPS" -ForegroundColor Green
Write-Host ""

# Step 4: Restart PM2
Write-Host "[4/5] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ PM2 restart failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ PM2 restarted" -ForegroundColor Green
Write-Host ""

# Step 5: Wait and verify
Write-Host "[5/5] Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15
Write-Host "  ✓ App should be running now" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""













