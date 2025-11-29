# Final deployment script - Fixed for Windows/VPS compatibility
param(
    [string]$VpsHost = "72.61.98.99",
    [string]$VpsUser = "root",
    [string]$VpsPath = "/var/www/cryptorafts"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FINAL VPS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Please run from cryptorafts-starter directory!" -ForegroundColor Red
    exit 1
}

# Find latest archive
$archive = Get-ChildItem -Path "." -Filter "cryptorafts-deploy-*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $archive) {
    Write-Host "ERROR: No archive found! Run DEPLOY_NOW.ps1 first." -ForegroundColor Red
    exit 1
}

$sizeMB = [math]::Round($archive.Length / 1MB, 2)
Write-Host "Archive: $($archive.Name)" -ForegroundColor Green
Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
Write-Host ""

# Upload
Write-Host "Step 1: Uploading archive..." -ForegroundColor Yellow
scp $archive.FullName "${VpsUser}@${VpsHost}:${VpsPath}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Upload complete!" -ForegroundColor Green
Write-Host ""

# Deploy - Use single line command to avoid CRLF issues
Write-Host "Step 2: Deploying on VPS..." -ForegroundColor Yellow

$deployCmd = "cd $VpsPath && rm -rf deploy-package && tar -xzf $($archive.Name) && cd deploy-package && npm ci --production=false && pm2 delete cryptorafts 2>/dev/null || true && pm2 start npm --name cryptorafts -- start && pm2 save"

ssh "${VpsUser}@${VpsHost}" $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your app is live at:" -ForegroundColor Yellow
    Write-Host "https://www.cryptorafts.com" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Deployment completed with warnings." -ForegroundColor Yellow
    Write-Host "Please check PM2 status on VPS." -ForegroundColor Yellow
    Write-Host ""
}


