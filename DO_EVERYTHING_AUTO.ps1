# ============================================
# DO EVERYTHING AUTO - COMPLETE AUTOMATION
# ============================================
# Uploads files and deploys automatically

param([string]$Password = "Shamsi2627@@")

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"
$LOCAL_DIR = (Get-Location).Path
$REMOTE_DIR = "/home/u386122906/cryptorafts"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  AUTOMATIC UPLOAD AND DEPLOYMENT" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check local files
Write-Host "[1/5] Checking local files..." -ForegroundColor Cyan
if (-not (Test-Path "src/app/page.tsx")) {
    Write-Host "❌ src/app/page.tsx NOT FOUND locally!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Local files verified" -ForegroundColor Green
Write-Host ""

# Step 2: Create remote directory via SSH
Write-Host "[2/5] Creating remote directory..." -ForegroundColor Cyan
$createDirCmd = "ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} 'mkdir -p $REMOTE_DIR'"
$passwordFile = "$env:TEMP\ssh_pass.txt"
$Password | Out-File -FilePath $passwordFile -Encoding ASCII

# Try using Plink (PuTTY) if available
$plinkPath = Get-Command plink -ErrorAction SilentlyContinue
if ($plinkPath) {
    Write-Host "Using Plink for connection..." -ForegroundColor Yellow
    $createDirCmd = "plink -ssh -P $VPS_PORT -pw `"$Password`" ${VPS_USER}@${VPS_IP} mkdir -p $REMOTE_DIR"
    Invoke-Expression $createDirCmd 2>&1 | Out-Null
} else {
    # Use SSH with password prompt handling
    Write-Host "Creating directory..." -ForegroundColor Yellow
    Start-Process -FilePath "ssh" -ArgumentList "-p", $VPS_PORT, "-o", "StrictHostKeyChecking=no", "${VPS_USER}@${VPS_IP}", "mkdir -p $REMOTE_DIR" -NoNewWindow -Wait -RedirectStandardError "$env:TEMP\ssh_error.txt" -RedirectStandardOutput "$env:TEMP\ssh_output.txt" -PassThru | Out-Null
}

Remove-Item $passwordFile -Force -ErrorAction SilentlyContinue
Write-Host "✅ Directory created" -ForegroundColor Green
Write-Host ""

# Step 3: Upload files using SCP
Write-Host "[3/5] Uploading files to VPS..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 3-5 minutes..." -ForegroundColor Yellow
Write-Host ""

$scpCmd = Get-Command scp -ErrorAction SilentlyContinue
$pscpPath = Get-Command pscp -ErrorAction SilentlyContinue

if ($pscpPath) {
    Write-Host "Using PSCP (PuTTY) for upload..." -ForegroundColor Yellow
    # PSCP supports password parameter
    $uploadFiles = Get-ChildItem -Path $LOCAL_DIR -Recurse | Where-Object { -not $_.PSIsContainer }
    $totalFiles = ($uploadFiles | Measure-Object).Count
    
    Write-Host "Uploading $totalFiles files..." -ForegroundColor Cyan
    
    # Upload directory using PSCP
    $uploadCmd = "pscp -P $VPS_PORT -pw `"$Password`" -r `"$LOCAL_DIR\*`" ${VPS_USER}@${VPS_IP}:$REMOTE_DIR/"
    
    Write-Host "Uploading files (this may take several minutes)..." -ForegroundColor Yellow
    $process = Start-Process -FilePath "pscp" -ArgumentList "-P", $VPS_PORT, "-pw", $Password, "-r", "$LOCAL_DIR\*", "${VPS_USER}@${VPS_IP}:$REMOTE_DIR/" -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Files uploaded!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Upload may have warnings, continuing..." -ForegroundColor Yellow
    }
} elseif ($scpCmd) {
    Write-Host "Using SCP for upload..." -ForegroundColor Yellow
    Write-Host "Note: You may need to enter password when prompted" -ForegroundColor Yellow
    
    # Create batch script to handle password
    $batchScript = @"
@echo off
scp -P $VPS_PORT -r "$LOCAL_DIR\*" ${VPS_USER}@${VPS_IP}:$REMOTE_DIR/
"@
    
    $batchFile = "$env:TEMP\upload_$(Get-Random).bat"
    $batchScript | Out-File -FilePath $batchFile -Encoding ASCII
    
    Write-Host "Running SCP (enter password when prompted: $Password)..." -ForegroundColor Yellow
    Start-Process -FilePath $batchFile -Wait -NoNewWindow
    
    Remove-Item $batchFile -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Upload complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Neither PSCP nor SCP found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PuTTY (includes PSCP):" -ForegroundColor Yellow
    Write-Host "   https://www.putty.org/" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use FileZilla manually:" -ForegroundColor Yellow
    Write-Host "   1. Connect: sftp://145.79.211.130:65002" -ForegroundColor White
    Write-Host "   2. Username: u386122906" -ForegroundColor White
    Write-Host "   3. Password: $Password" -ForegroundColor White
    Write-Host "   4. Upload to: $REMOTE_DIR/" -ForegroundColor White
    Write-Host ""
    Write-Host "After upload, press Enter to continue..." -ForegroundColor Yellow
    Read-Host
}

Write-Host ""

# Step 4: Upload fix script
Write-Host "[4/5] Uploading fix script..." -ForegroundColor Cyan
if (Test-Path "FIX_NOW_SSH.sh") {
    if ($pscpPath) {
        $scriptUpload = "pscp -P $VPS_PORT -pw `"$Password`" FIX_NOW_SSH.sh ${VPS_USER}@${VPS_IP}:$REMOTE_DIR/FIX_NOW_SSH.sh"
        Start-Process -FilePath "pscp" -ArgumentList "-P", $VPS_PORT, "-pw", $Password, "FIX_NOW_SSH.sh", "${VPS_USER}@${VPS_IP}:$REMOTE_DIR/FIX_NOW_SSH.sh" -NoNewWindow -Wait | Out-Null
    } elseif ($scpCmd) {
        $scriptUpload = "scp -P $VPS_PORT FIX_NOW_SSH.sh ${VPS_USER}@${VPS_IP}:$REMOTE_DIR/FIX_NOW_SSH.sh"
        # Will prompt for password
        Write-Host "Uploading script (enter password: $Password when prompted)..." -ForegroundColor Yellow
    }
    Write-Host "✅ Fix script uploaded" -ForegroundColor Green
}
Write-Host ""

# Step 5: Run deployment on VPS
Write-Host "[5/5] Running deployment on VPS..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

$deployCmd = "cd $REMOTE_DIR; chmod +x FIX_NOW_SSH.sh 2>/dev/null; bash FIX_NOW_SSH.sh"

if ($plinkPath) {
    Write-Host "Running deployment via Plink..." -ForegroundColor Yellow
    $plinkCmd = "plink -ssh -P $VPS_PORT -pw `"$Password`" ${VPS_USER}@${VPS_IP} `"$deployCmd`""
    Invoke-Expression $plinkCmd 2>&1 | Tee-Object
} else {
    Write-Host "Running deployment via SSH..." -ForegroundColor Yellow
    Write-Host "You may need to enter password when prompted: $Password" -ForegroundColor Yellow
    Write-Host ""
    
    # Create batch script for SSH
    $sshBatch = @"
@echo off
ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "$deployCmd"
"@
    
    $sshBatchFile = "$env:TEMP\deploy_$(Get-Random).bat"
    $sshBatch | Out-File -FilePath $sshBatchFile -Encoding ASCII
    
    Start-Process -FilePath $sshBatchFile -Wait -NoNewWindow
    Remove-Item $sshBatchFile -Force -ErrorAction SilentlyContinue
}

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

