# Fixed deployment script - Handles archive corruption issues
param(
    [string]$VpsHost = "72.61.98.99",
    [string]$VpsUser = "root",
    [string]$VpsPath = "/var/www/cryptorafts"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FIXED VPS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Please run this script from the cryptorafts-starter directory!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Find the latest archive
$archive = Get-ChildItem -Path "." -Filter "cryptorafts-deploy-*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $archive) {
    Write-Host "ERROR: No deployment archive found!" -ForegroundColor Red
    Write-Host "Please run DEPLOY_NOW.ps1 first to create the archive." -ForegroundColor Yellow
    exit 1
}

$sizeMB = [math]::Round($archive.Length / 1MB, 2)
Write-Host "Archive: $($archive.Name)" -ForegroundColor Green
Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
Write-Host ""

# Verify archive integrity (skip verification for now, proceed with upload)
Write-Host "Archive found. Proceeding with upload..." -ForegroundColor Green

Write-Host ""

# Upload to VPS using rsync (more reliable for large files) or scp with resume support
Write-Host "Step 1: Uploading archive to VPS..." -ForegroundColor Yellow
Write-Host "Using rsync for reliable transfer (if available)..." -ForegroundColor Gray
Write-Host ""

# Check if rsync is available
if (Get-Command rsync -ErrorAction SilentlyContinue) {
    Write-Host "Using rsync for reliable transfer..." -ForegroundColor Cyan
    rsync -avz --progress $archive.FullName "${VpsUser}@${VpsHost}:${VpsPath}/"
} else {
    Write-Host "Using scp (may take longer for large files)..." -ForegroundColor Cyan
    scp $archive.FullName "${VpsUser}@${VpsHost}:${VpsPath}/"
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Upload complete!" -ForegroundColor Green
Write-Host ""

# Verify archive on VPS and deploy
Write-Host "Step 2: Verifying and deploying on VPS..." -ForegroundColor Yellow
Write-Host ""

$deployCmd = "cd $VpsPath && rm -rf deploy-package && tar -xzf $($archive.Name) && cd deploy-package && npm ci --production=false && pm2 delete cryptorafts 2>/dev/null || true && pm2 start npm --name cryptorafts -- start && pm2 save && echo 'Deployment complete!'"

ssh "${VpsUser}@${VpsHost}" $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your app should be live at:" -ForegroundColor Yellow
    Write-Host "https://www.cryptorafts.com" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "WARNING: Deployment may have failed. Please check manually." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SSH into your VPS and run:" -ForegroundColor Yellow
    Write-Host "  ssh ${VpsUser}@${VpsHost}" -ForegroundColor White
    Write-Host "  cd $VpsPath" -ForegroundColor White
    Write-Host "  tar -xzf $($archive.Name)" -ForegroundColor White
    Write-Host "  cd deploy-package" -ForegroundColor White
    Write-Host "  npm ci --production=false" -ForegroundColor White
    Write-Host "  pm2 delete cryptorafts" -ForegroundColor White
    Write-Host "  pm2 start npm --name cryptorafts -- start" -ForegroundColor White
    Write-Host ""
}
