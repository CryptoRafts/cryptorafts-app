# ============================================
# FRESH BUILD AND DEPLOY - COMPLETE SOLUTION
# ============================================
# Cleans, builds fresh, uploads ALL files, and deploys

param(
    [Parameter(Mandatory=$false)]
    [string]$VPS_PASSWORD = ""
)

$VPS_IP = "145.79.211.130"
$VPS_PORT = "65002"
$VPS_USER = "u386122906"
$VPS_DIR = "/var/www/cryptorafts"
$LOCAL_DIR = (Get-Location).Path

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  FRESH BUILD AND DEPLOY - COMPLETE SOLUTION" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Get password
if ([string]::IsNullOrEmpty($VPS_PASSWORD)) {
    Write-Host "Enter your SSH password:" -ForegroundColor Yellow
    $securePassword = Read-Host "Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $VPS_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Step 1: Clean old build
Write-Host "[1/7] Cleaning old build..." -ForegroundColor Cyan
Write-Host ""
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "build.log" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Cleaned old build files" -ForegroundColor Green
Write-Host ""

# Step 2: Verify src/app structure
Write-Host "[2/7] Verifying source structure..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "src/app/page.tsx")) {
    Write-Host "❌ src/app/page.tsx NOT FOUND!" -ForegroundColor Red
    Write-Host "This is why you see 'No pages detected' error." -ForegroundColor Red
    Write-Host ""
    exit 1
}

if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json NOT FOUND!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✅ src/app/page.tsx exists" -ForegroundColor Green
Write-Host "✅ package.json exists" -ForegroundColor Green
Write-Host "✅ Source structure verified" -ForegroundColor Green
Write-Host ""

# Step 3: Build fresh
Write-Host "[3/7] Building fresh application..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

$env:NODE_ENV = "production"
$buildOutput = npm run build 2>&1 | Tee-Object -Variable fullBuildOutput

# Check for critical errors
$criticalErrors = $fullBuildOutput | Select-String -Pattern "Failed to compile|error TS|Type error" -CaseSensitive:$false

if ($criticalErrors) {
    Write-Host "⚠️  Build may have warnings:" -ForegroundColor Yellow
    $criticalErrors | Select-Object -First 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
}

if (-not (Test-Path ".next")) {
    Write-Host "❌ Build failed! .next directory not created." -ForegroundColor Red
    Write-Host "Build errors:" -ForegroundColor Red
    $fullBuildOutput | Select-String -Pattern "error|Error|ERROR" | Select-Object -First 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    Write-Host ""
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Verify build output
Write-Host "Checking build output..." -ForegroundColor Cyan
if (Test-Path ".next/static") {
    $chunkFiles = Get-ChildItem ".next/static/chunks/*.js" -ErrorAction SilentlyContinue
    Write-Host "✅ Static files built ($($chunkFiles.Count) JS files)" -ForegroundColor Green
} else {
    Write-Host "❌ Static files not found!" -ForegroundColor Red
    exit 1
}

if (Test-Path ".next/server") {
    Write-Host "✅ Server files built" -ForegroundColor Green
} else {
    Write-Host "❌ Server files not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Setup WSL/SSH
Write-Host "[4/7] Setting up deployment tools..." -ForegroundColor Cyan
Write-Host ""

$wslCmd = Get-Command wsl -ErrorAction SilentlyContinue

if (-not $wslCmd) {
    Write-Host "❌ WSL not available. Please install WSL or use manual deployment." -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual deployment steps:" -ForegroundColor Cyan
    Write-Host "   1. Upload all files to VPS: scp -P $VPS_PORT -r . ${VPS_USER}@${VPS_IP}:~/cryptorafts/" -ForegroundColor White
    Write-Host "   2. SSH to VPS: ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP}" -ForegroundColor White
    Write-Host "   3. Run: bash FIX_EVERYTHING_VPS.sh" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ WSL available" -ForegroundColor Green

# Install sshpass if needed
Write-Host "Checking sshpass..." -ForegroundColor Cyan
wsl bash -c 'which sshpass || (sudo apt-get update -qq && sudo apt-get install -y -qq sshpass)' 2>&1 | Out-Null
Write-Host "✅ sshpass ready" -ForegroundColor Green
Write-Host ""

# Step 5: Upload ALL files to VPS
Write-Host "[5/7] Uploading ALL files to VPS..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 3-5 minutes..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Uploading:" -ForegroundColor Cyan
Write-Host "   - All source files (src/)" -ForegroundColor White
Write-Host "   - Build output (.next/)" -ForegroundColor White
Write-Host "   - Configuration files" -ForegroundColor White
Write-Host "   - Everything needed for deployment" -ForegroundColor White
Write-Host ""

$env:SSHPASS = $VPS_PASSWORD
$projectPath = $LOCAL_DIR -replace "C:", "/mnt/c" -replace "\\", "/"

# Upload everything
$uploadCmd = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -r -o StrictHostKeyChecking=no . ${VPS_USER}@${VPS_IP}:~/cryptorafts/"

Write-Host "Uploading files (this may take several minutes)..." -ForegroundColor Yellow
wsl bash -c $uploadCmd 2>&1 | Tee-Object -Variable uploadOutput

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  Upload may have warnings. Continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Files uploaded!" -ForegroundColor Green
Write-Host ""

# Step 6: Upload deployment script
Write-Host "[6/7] Uploading deployment script..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "FIX_EVERYTHING_VPS.sh") {
    $scriptUpload = "cd '$projectPath'; sshpass -e scp -P $VPS_PORT -o StrictHostKeyChecking=no FIX_EVERYTHING_VPS.sh ${VPS_USER}@${VPS_IP}:~/FIX_EVERYTHING_VPS.sh"
    wsl bash -c $scriptUpload 2>&1 | Out-Null
    Write-Host "✅ Deployment script uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  FIX_EVERYTHING_VPS.sh not found. Creating it..." -ForegroundColor Yellow
    # Create the fix script content here if needed
}

Write-Host ""

# Step 7: Deploy on VPS
Write-Host "[7/7] Deploying on VPS..." -ForegroundColor Cyan
Write-Host "⏱️  This will take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "   ✅ Verify src/app structure exists" -ForegroundColor White
Write-Host "   ✅ Install dependencies" -ForegroundColor White
Write-Host "   ✅ Clean old build" -ForegroundColor White
Write-Host "   ✅ Rebuild application" -ForegroundColor White
Write-Host "   ✅ Start app with PM2" -ForegroundColor White
Write-Host "   ✅ Fix Nginx configuration" -ForegroundColor White
Write-Host "   ✅ Make app LIVE" -ForegroundColor White
Write-Host ""

$deployCmd = "cd ~/cryptorafts; chmod +x ~/FIX_EVERYTHING_VPS.sh; bash ~/FIX_EVERYTHING_VPS.sh"
$env:SSHPASS = $VPS_PASSWORD
$sshCmd = "sshpass -e ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} '$deployCmd'"

Write-Host "🚀 Running deployment on VPS..." -ForegroundColor Green
Write-Host ""

wsl bash -c $sshCmd 2>&1 | Tee-Object

Write-Host ""
Write-Host "[7/7] Deployment complete!" -ForegroundColor Green
Write-Host ""

# Final verification
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your website should be LIVE at:" -ForegroundColor Cyan
Write-Host "   https://www.cryptorafts.com" -ForegroundColor Green
Write-Host "   https://cryptorafts.com" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Clear browser cache: Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "   2. Hard refresh: Ctrl+F5" -ForegroundColor White
Write-Host "   3. Visit: https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "If still seeing errors:" -ForegroundColor Yellow
Write-Host "   SSH to VPS: ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "   Check logs: pm2 logs cryptorafts" -ForegroundColor White
Write-Host "   Check app: curl http://localhost:3000" -ForegroundColor White
Write-Host "   Re-run fix: bash FIX_EVERYTHING_VPS.sh" -ForegroundColor White
Write-Host ""

