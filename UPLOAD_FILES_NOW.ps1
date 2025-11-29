# Upload files using SCP (if OpenSSH is installed in Windows)
param([string]$Password = "Shamsi2627@@")

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"
$LOCAL_DIR = (Get-Location).Path

Write-Host "Uploading files to VPS..." -ForegroundColor Green
Write-Host "This will take 3-5 minutes..." -ForegroundColor Yellow
Write-Host ""

# Check if scp is available
$scpCmd = Get-Command scp -ErrorAction SilentlyContinue

if ($scpCmd) {
    Write-Host "Using Windows OpenSSH (scp)..." -ForegroundColor Cyan
    
    # Upload all files
    Write-Host "Uploading files..." -ForegroundColor Yellow
    $uploadCmd = "scp -P $VPS_PORT -r '$LOCAL_DIR'/* ${VPS_USER}@${VPS_IP}:~/cryptorafts/"
    
    # Note: SCP will prompt for password
    # User needs to enter: Shamsi2627@@
    Invoke-Expression $uploadCmd
    
    Write-Host ""
    Write-Host "Files uploaded!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now SSH to VPS and run:" -ForegroundColor Cyan
    Write-Host "  cd ~/cryptorafts" -ForegroundColor White
    Write-Host "  bash FIX_EVERYTHING_VPS.sh" -ForegroundColor White
    
} else {
    Write-Host "OpenSSH (scp) not found in Windows." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Use FileZilla instead:" -ForegroundColor Cyan
    Write-Host "  1. Download FileZilla: https://filezilla-project.org/" -ForegroundColor White
    Write-Host "  2. Connect: sftp://145.79.211.130:65002" -ForegroundColor White
    Write-Host "  3. Username: u386122906" -ForegroundColor White
    Write-Host "  4. Password: Shamsi2627@@" -ForegroundColor White
    Write-Host "  5. Upload ALL files to: ~/cryptorafts/" -ForegroundColor White
}

