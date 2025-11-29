# Simple deployment - no interaction needed
param([string]$Password = "Shmasi2627@@")

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"
$LOCAL_DIR = (Get-Location).Path
$projectPath = $LOCAL_DIR -replace "C:", "/mnt/c" -replace "\\", "/"

Write-Host "Starting deployment..." -ForegroundColor Green

# Install sshpass
wsl bash -c "which sshpass || (sudo apt-get update -qq && sudo apt-get install -y -qq sshpass)" 2>&1 | Out-Null

# Set password
$env:SSHPASS = $Password

# Upload files
Write-Host "Uploading files..." -ForegroundColor Cyan
$uploadCmd = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -r -o StrictHostKeyChecking=no . ${VPS_USER}@${VPS_IP}:~/cryptorafts/"
wsl bash -c $uploadCmd 2>&1 | Out-Null

# Upload fix script
Write-Host "Uploading fix script..." -ForegroundColor Cyan
$scriptUpload = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -o StrictHostKeyChecking=no FIX_EVERYTHING_VPS.sh ${VPS_USER}@${VPS_IP}:~/FIX_EVERYTHING_VPS.sh"
wsl bash -c $scriptUpload 2>&1 | Out-Null

# Deploy
Write-Host "Deploying on VPS..." -ForegroundColor Cyan
$deployCmd = "cd ~/cryptorafts; chmod +x ~/FIX_EVERYTHING_VPS.sh; bash ~/FIX_EVERYTHING_VPS.sh"
$sshCmd = "sshpass -e ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} '$deployCmd'"
wsl bash -c $sshCmd

Write-Host "Done!" -ForegroundColor Green

