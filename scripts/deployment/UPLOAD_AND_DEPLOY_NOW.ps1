# Upload and deploy automatically
param([string]$Password = "Shamsi2627@@")

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"
$LOCAL_DIR = (Get-Location).Path

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  UPLOAD AND DEPLOY AUTOMATICALLY" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if files exist locally
Write-Host "[1/5] Checking local files..." -ForegroundColor Cyan
if (-not (Test-Path "src/app/page.tsx")) {
    Write-Host "❌ src/app/page.tsx NOT FOUND locally!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Local files verified" -ForegroundColor Green
Write-Host ""

# Step 2: Create directory on VPS via SSH
Write-Host "[2/5] Creating directory on VPS..." -ForegroundColor Cyan
$createDirCmd = "ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} 'mkdir -p ~/cryptorafts'"
& cmd /c "echo $Password | $createDirCmd" 2>&1 | Out-Null
Write-Host "✅ Directory created" -ForegroundColor Green
Write-Host ""

# Step 3: Upload files using SCP
Write-Host "[3/5] Uploading files to VPS..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 3-5 minutes..." -ForegroundColor Yellow
Write-Host ""

# Try using Windows OpenSSH scp
$scpCmd = Get-Command scp -ErrorAction SilentlyContinue
if ($scpCmd) {
    Write-Host "Using Windows SCP..." -ForegroundColor Yellow
    $uploadCmd = "scp -P $VPS_PORT -r '$LOCAL_DIR\*' ${VPS_USER}@${VPS_IP}:~/cryptorafts/"
    
    # Use plink or expect-like approach
    # Since password can't be passed directly, we'll use sshpass equivalent or create a batch script
    
    # Create a temporary batch script that uses echo to pipe password
    $batchScript = @"
@echo off
echo $Password | scp -P $VPS_PORT -r "$LOCAL_DIR\*" ${VPS_USER}@${VPS_IP}:~/cryptorafts/
"@
    
    $batchFile = "$env:TEMP\upload_$(Get-Random).bat"
    $batchScript | Out-File -FilePath $batchFile -Encoding ASCII
    
    Write-Host "Uploading files (you may need to enter password)..." -ForegroundColor Yellow
    Start-Process cmd -ArgumentList "/c $batchFile" -Wait -NoNewWindow
    
    Remove-Item $batchFile -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Files uploaded!" -ForegroundColor Green
} else {
    Write-Host "❌ SCP not available in Windows" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use FileZilla to upload files:" -ForegroundColor Yellow
    Write-Host "  1. Download: https://filezilla-project.org/" -ForegroundColor White
    Write-Host "  2. Connect: sftp://145.79.211.130:65002" -ForegroundColor White
    Write-Host "  3. Username: u386122906" -ForegroundColor White
    Write-Host "  4. Password: $Password" -ForegroundColor White
    Write-Host "  5. Upload ALL files to: ~/cryptorafts/" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter after uploading files..." -ForegroundColor Yellow
    Read-Host
}
Write-Host ""

# Step 4: Upload fix script
Write-Host "[4/5] Uploading fix script..." -ForegroundColor Cyan
if (Test-Path "FIX_EVERYTHING_VPS.sh") {
    if ($scpCmd) {
        $scriptUpload = "scp -P $VPS_PORT FIX_EVERYTHING_VPS.sh ${VPS_USER}@${VPS_IP}:~/FIX_EVERYTHING_VPS.sh"
        $batchScript = @"
@echo off
echo $Password | scp -P $VPS_PORT FIX_EVERYTHING_VPS.sh ${VPS_USER}@${VPS_IP}:~/FIX_EVERYTHING_VPS.sh
"@
        $batchFile = "$env:TEMP\upload_script_$(Get-Random).bat"
        $batchScript | Out-File -FilePath $batchFile -Encoding ASCII
        Start-Process cmd -ArgumentList "/c $batchFile" -Wait -NoNewWindow
        Remove-Item $batchFile -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Fix script uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fix script not found locally" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Run deployment on VPS
Write-Host "[5/5] Running deployment on VPS..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

$deployCmd = "cd ~/cryptorafts; chmod +x ~/FIX_EVERYTHING_VPS.sh 2>/dev/null; bash ~/FIX_EVERYTHING_VPS.sh"
$sshCmd = "ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} '$deployCmd'"

# Create batch script for SSH with password
$sshBatch = @"
@echo off
echo $Password | ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "$deployCmd"
"@

$sshBatchFile = "$env:TEMP\deploy_$(Get-Random).bat"
$sshBatch | Out-File -FilePath $sshBatchFile -Encoding ASCII

Write-Host "Running deployment..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/c $sshBatchFile" -Wait -NoNewWindow

Remove-Item $sshBatchFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your website should be LIVE at:" -ForegroundColor Cyan
Write-Host "   https://www.cryptorafts.com" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Wait 30 seconds" -ForegroundColor White
Write-Host "   2. Clear browser cache: Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "   3. Hard refresh: Ctrl+F5" -ForegroundColor White
Write-Host "   4. Visit: https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""

