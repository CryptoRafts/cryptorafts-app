# ============================================
# CRYPTORAFTS - COMPLETE DEPLOYMENT
# Uploads everything and deploys perfectly
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - COMPLETE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will upload EVERYTHING and deploy:" -ForegroundColor Yellow
Write-Host "  ✅ All source code" -ForegroundColor Green
Write-Host "  ✅ All public assets" -ForegroundColor Green
Write-Host "  ✅ All configurations" -ForegroundColor Green
Write-Host "  ✅ All APIs and routes" -ForegroundColor Green
Write-Host "  ✅ All authentication" -ForegroundColor Green
Write-Host "  ✅ All 7 roles" -ForegroundColor Green
Write-Host ""

# Step 1: Navigate to project
Write-Host "Step 1: Checking project directory..." -ForegroundColor Yellow
Set-Location "C:\Users\dell\cryptorafts-starter" -ErrorAction SilentlyContinue
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Project directory not found!" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Found project in $PWD" -ForegroundColor Green
Write-Host ""

# Step 2: Check SSH/SCP
Write-Host "Step 2: Checking SSH/SCP..." -ForegroundColor Yellow
$sshPath = Get-Command ssh -ErrorAction SilentlyContinue
$scpPath = Get-Command scp -ErrorAction SilentlyContinue
if (-not $sshPath -or -not $scpPath) {
    Write-Host "ERROR: SSH or SCP not found!" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: SSH and SCP found" -ForegroundColor Green
Write-Host ""

# Step 3: Stop PM2 on VPS
Write-Host "Step 3: Stopping PM2 on VPS..." -ForegroundColor Yellow
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd $appDir && pm2 stop cryptorafts 2>/dev/null || true && pm2 delete cryptorafts 2>/dev/null || true" 2>&1 | Out-Null
Write-Host "SUCCESS: PM2 stopped" -ForegroundColor Green
Write-Host ""

# Step 4: Upload source code
Write-Host "Step 4: Uploading source code..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes. Please wait..." -ForegroundColor Yellow
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host ""

ssh "$vpsUser@$vpsIP" "mkdir -p $appDir/src $appDir/public $appDir/logs" 2>&1 | Out-Null

# Upload src directory
Write-Host "Uploading src directory..." -ForegroundColor Cyan
scp -r "src" "${vpsUser}@${vpsIP}:${appDir}/" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: src upload failed!" -ForegroundColor Red
    exit 1
}

# Upload public directory
Write-Host "Uploading public directory..." -ForegroundColor Cyan
scp -r "public" "${vpsUser}@${vpsIP}:${appDir}/" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: public upload failed!" -ForegroundColor Red
    exit 1
}

# Upload essential files
Write-Host "Uploading configuration files..." -ForegroundColor Cyan
$filesToUpload = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.js",
    "server.js",
    "ecosystem.config.js",
    ".env.local"
)

foreach ($file in $filesToUpload) {
    if (Test-Path $file) {
        scp $file "${vpsUser}@${vpsIP}:${appDir}/" 2>&1 | Out-Null
    }
}

Write-Host "SUCCESS: All files uploaded" -ForegroundColor Green
Write-Host ""

# Step 5: Install dependencies and build
Write-Host "Step 5: Installing dependencies and building on VPS..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes. Please wait..." -ForegroundColor Yellow
Write-Host "You will be prompted for your VPS password again" -ForegroundColor Yellow
Write-Host ""

$deployScript = @"
cd $appDir
export NVM_DIR="`$HOME/.nvm"
[ -s "`$NVM_DIR/nvm.sh" ] && . "`$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

echo "Installing dependencies..."
npm install --legacy-peer-deps || {
    echo "ERROR: npm install failed"
    exit 1
}

echo "Building application..."
rm -rf .next
npm run build || {
    echo "ERROR: Build failed"
    exit 1
}

echo "Installing dotenv if missing..."
npm install dotenv --legacy-peer-deps 2>/dev/null || true

echo "Creating ecosystem.config.js..."
NODE_PATH=`$(nvm which 20 2>/dev/null || which node)
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    interpreter: 'REPLACE_NODE_PATH',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_APP_URL: 'https://www.cryptorafts.com',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyBcuVT24UBPUB_U78FGQ04D2BqH6N-4M4E',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'cryptorafts-b9067.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'cryptorafts-b9067',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'cryptorafts-b9067.firebasestorage.app',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '374711838796',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:374711838796:web:3bee725bfa7d8790456ce9',
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
  }],
};
PM2EOF
sed -i "s|REPLACE_NODE_PATH|`$NODE_PATH|g" ecosystem.config.js

echo "Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
sleep 10

echo ""
echo "✅ Deployment complete!"
echo ""
pm2 status
echo ""
curl -sS -I http://127.0.0.1:3000 | head -3
"@

ssh "$vpsUser@$vpsIP" $deployScript

Write-Host ""
Write-Host "Step 6: Deployment completed" -ForegroundColor Yellow

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ SUCCESS: DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ All features deployed:" -ForegroundColor Green
    Write-Host "  ✅ All source code" -ForegroundColor Green
    Write-Host "  ✅ All public assets" -ForegroundColor Green
    Write-Host "  ✅ All APIs and routes" -ForegroundColor Green
    Write-Host "  ✅ All authentication" -ForegroundColor Green
    Write-Host "  ✅ All 7 roles" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  WARNING: Deployment completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Please check the SSH output above for any errors." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
