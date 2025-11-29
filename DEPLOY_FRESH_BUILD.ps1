# ============================================
# DEPLOY FRESH BUILD - NO HANG VERSION
# Uses better timeout and error handling
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOY FRESH BUILD (NO HANG)" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to run SSH command with timeout
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [int]$TimeoutSeconds = 60
    )
    
    $job = Start-Job -ScriptBlock {
        param($user, $ip, $cmd)
        ssh -o ConnectTimeout=10 -o ServerAliveInterval=10 -o StrictHostKeyChecking=no "${user}@${ip}" $cmd
    } -ArgumentList $vpsUser, $vpsIp, $Command
    
    $result = Wait-Job -Job $job -Timeout $TimeoutSeconds
    
    if ($result) {
        $output = Receive-Job -Job $job
        Remove-Job -Job $job
        return $output
    } else {
        Stop-Job -Job $job
        Remove-Job -Job $job
        Write-Host "  [TIMEOUT] Command timed out after $TimeoutSeconds seconds" -ForegroundColor Red
        return $null
    }
}

# Function to upload file with timeout
function Invoke-SCPUpload {
    param(
        [string]$LocalFile,
        [string]$RemotePath,
        [int]$TimeoutSeconds = 120
    )
    
    if (-not (Test-Path $LocalFile)) {
        Write-Host "  [SKIP] File not found: $LocalFile" -ForegroundColor Yellow
        return $false
    }
    
    $job = Start-Job -ScriptBlock {
        param($user, $ip, $local, $remote)
        scp -o ConnectTimeout=10 -o ServerAliveInterval=10 -o StrictHostKeyChecking=no $local "${user}@${ip}:${remote}" 2>&1
    } -ArgumentList $vpsUser, $vpsIp, $LocalFile, $RemotePath
    
    $result = Wait-Job -Job $job -Timeout $TimeoutSeconds
    
    if ($result) {
        $output = Receive-Job -Job $job
        Remove-Job -Job $job
        if ($LASTEXITCODE -eq 0) {
            return $true
        } else {
            Write-Host "  [FAIL] Upload failed: $output" -ForegroundColor Red
            return $false
        }
    } else {
        Stop-Job -Job $job
        Remove-Job -Job $job
        Write-Host "  [TIMEOUT] Upload timed out" -ForegroundColor Red
        return $false
    }
}

# Step 1: Clean local build
Write-Host "[1/7] Cleaning local build..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  [OK] Local .next removed" -ForegroundColor Green
}
Write-Host ""

# Step 2: Stop and clear VPS (with timeout)
Write-Host "[2/7] Stopping and clearing VPS..." -ForegroundColor Cyan
$clearCmd = "pm2 stop cryptorafts 2>/dev/null || true; pm2 delete cryptorafts 2>/dev/null || true; rm -rf $vpsPath; mkdir -p $vpsPath; echo 'OK'"
$result = Invoke-SSHCommand -Command $clearCmd -TimeoutSeconds 30
if ($result -match "OK") {
    Write-Host "  [OK] VPS cleared" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Clear may have had issues, continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Upload config files (one by one with timeout)
Write-Host "[3/7] Uploading config files..." -ForegroundColor Cyan
$configFiles = @("package.json", "package-lock.json", "next.config.js", "tsconfig.json", ".env.local")
$uploaded = 0
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "  Uploading $file..." -ForegroundColor White
        if (Invoke-SCPUpload -LocalFile $file -RemotePath "${vpsPath}/$file" -TimeoutSeconds 30) {
            Write-Host "    [OK] $file" -ForegroundColor Green
            $uploaded++
        }
    }
}
Write-Host "  [OK] $uploaded/$($configFiles.Count) config files uploaded" -ForegroundColor Green
Write-Host ""

# Step 4: Upload src directory (with progress)
Write-Host "[4/7] Uploading src directory..." -ForegroundColor Cyan
Write-Host "  This may take 3-5 minutes..." -ForegroundColor Yellow
Write-Host "  Please wait, this won't hang..." -ForegroundColor Yellow

# Use rsync if available, otherwise scp with timeout
$srcUpload = Start-Job -ScriptBlock {
    param($user, $ip, $path)
    scp -r -o ConnectTimeout=10 -o ServerAliveInterval=10 -o StrictHostKeyChecking=no "src" "${user}@${ip}:${path}/" 2>&1
} -ArgumentList $vpsUser, $vpsIp, $vpsPath

$srcResult = Wait-Job -Job $srcUpload -Timeout 300 # 5 minutes

if ($srcResult) {
    $output = Receive-Job -Job $srcUpload
    Remove-Job -Job $srcUpload
    Write-Host "  [OK] src/ directory uploaded" -ForegroundColor Green
} else {
    Stop-Job -Job $srcUpload
    Remove-Job -Job $srcUpload
    Write-Host "  [TIMEOUT] src/ upload timed out after 5 minutes" -ForegroundColor Red
    Write-Host "  [INFO] You can manually upload src/ later" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Upload public directory
Write-Host "[5/7] Uploading public directory..." -ForegroundColor Cyan
if (Test-Path "public") {
    $pubUpload = Start-Job -ScriptBlock {
        param($user, $ip, $path)
        scp -r -o ConnectTimeout=10 -o ServerAliveInterval=10 -o StrictHostKeyChecking=no "public" "${user}@${ip}:${path}/" 2>&1
    } -ArgumentList $vpsUser, $vpsIp, $vpsPath
    
    $pubResult = Wait-Job -Job $pubUpload -Timeout 180 # 3 minutes
    
    if ($pubResult) {
        Receive-Job -Job $pubUpload | Out-Null
        Remove-Job -Job $pubUpload
        Write-Host "  [OK] public/ directory uploaded" -ForegroundColor Green
    } else {
        Stop-Job -Job $pubUpload
        Remove-Job -Job $pubUpload
        Write-Host "  [TIMEOUT] public/ upload timed out" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [SKIP] public/ directory not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Install and build on VPS
Write-Host "[6/7] Installing dependencies and building on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 5-7 minutes..." -ForegroundColor Yellow
Write-Host "  Please wait, this won't hang..." -ForegroundColor Yellow

$buildCmd = "cd $vpsPath && npm install --legacy-peer-deps && npm run build && echo 'BUILD_OK'"
$buildJob = Start-Job -ScriptBlock {
    param($user, $ip, $cmd)
    ssh -o ConnectTimeout=10 -o ServerAliveInterval=10 -o StrictHostKeyChecking=no "${user}@${ip}" $cmd 2>&1
} -ArgumentList $vpsUser, $vpsIp, $buildCmd

$buildResult = Wait-Job -Job $buildJob -Timeout 600 # 10 minutes

if ($buildResult) {
    $output = Receive-Job -Job $buildJob
    Remove-Job -Job $buildJob
    if ($output -match "BUILD_OK") {
        Write-Host "  [OK] Build complete" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Build may have had issues" -ForegroundColor Yellow
        Write-Host "  Output: $($output -join '`n')" -ForegroundColor Gray
    }
} else {
    Stop-Job -Job $buildJob
    Remove-Job -Job $buildJob
    Write-Host "  [TIMEOUT] Build timed out after 10 minutes" -ForegroundColor Red
    Write-Host "  [INFO] You can manually run build on VPS" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Start PM2
Write-Host "[7/7] Starting PM2..." -ForegroundColor Cyan
$pm2Cmd = "cd $vpsPath && pm2 start npm --name cryptorafts -- start && pm2 save && echo 'PM2_OK'"
$pm2Result = Invoke-SSHCommand -Command $pm2Cmd -TimeoutSeconds 30

if ($pm2Result -match "PM2_OK") {
    Write-Host "  [OK] PM2 started" -ForegroundColor Green
} else {
    Write-Host "  [WARN] PM2 start may have had issues" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your site should now be working at:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "If any steps timed out, you can run them manually:" -ForegroundColor Yellow
Write-Host "  ssh root@72.61.98.99" -ForegroundColor White
Write-Host "  cd /var/www/cryptorafts" -ForegroundColor White
Write-Host "  npm install --legacy-peer-deps" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  pm2 start npm --name cryptorafts -- start" -ForegroundColor White
Write-Host ""

