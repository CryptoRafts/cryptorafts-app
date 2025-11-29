# Check deployment status
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CHECKING DEPLOYMENT STATUS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if tar is still running
$tarProcesses = Get-Process -Name "tar" -ErrorAction SilentlyContinue
if ($tarProcesses) {
    Write-Host "Tar process is still running..." -ForegroundColor Yellow
    Write-Host "This is normal for large archives. Please wait..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Estimated time remaining: 3-8 minutes" -ForegroundColor Cyan
} else {
    Write-Host "Tar process completed!" -ForegroundColor Green
}

# Check if archive exists
$archive = Get-ChildItem -Path "." -Filter "cryptorafts-deploy-*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($archive) {
    $sizeMB = [math]::Round($archive.Length / 1MB, 2)
    Write-Host ""
    Write-Host "Archive found: $($archive.Name)" -ForegroundColor Green
    Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
    Write-Host "Created: $($archive.LastWriteTime)" -ForegroundColor Gray
    
    if ($sizeMB -lt 100) {
        Write-Host ""
        Write-Host "WARNING: Archive seems small. It may still be creating..." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Archive appears complete!" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "No archive found yet. Still creating..." -ForegroundColor Yellow
}

# Check deploy-package folder
$deployDir = "deploy-package"
if (Test-Path $deployDir) {
    Write-Host ""
    Write-Host "Deployment package folder exists: $deployDir" -ForegroundColor Green
    
    # If archive is taking too long, suggest alternative
    if ($tarProcesses -and $archive -and $archive.LastWriteTime -lt (Get-Date).AddMinutes(-10)) {
        Write-Host ""
        Write-Host "Archive creation seems to be taking too long." -ForegroundColor Yellow
        Write-Host "Alternative: Upload the deploy-package folder directly to your VPS" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "You can use:" -ForegroundColor White
        Write-Host "  scp -r deploy-package root@72.61.98.99:/var/www/cryptorafts/" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan


