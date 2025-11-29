# ============================================
# COMPLETE DEPLOYMENT - POWERSHELL VERSION
# This will finish the deployment on VPS
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "COMPLETING DEPLOYMENT ON VPS..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  ✅ Install dependencies" -ForegroundColor Green
Write-Host "  ✅ Build the application" -ForegroundColor Green
Write-Host "  ✅ Configure PM2" -ForegroundColor Green
Write-Host "  ✅ Start the server" -ForegroundColor Green
Write-Host ""
Write-Host "You will be prompted for your VPS password" -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes. Please wait..." -ForegroundColor Yellow
Write-Host ""

# Create a temporary script file on VPS
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

echo "Installing dotenv..."
npm install dotenv --legacy-peer-deps || true

echo "Building application..."
rm -rf .next
npm run build || {
    echo "ERROR: Build failed"
    exit 1
}

echo "Configuring PM2..."
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
pm2 delete cryptorafts 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
sleep 10

echo ""
echo "✅ Deployment complete!"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Testing server..."
curl -sS -I http://127.0.0.1:3000 | head -3
echo ""
"@

# Upload the script to VPS and execute it
Write-Host "Uploading deployment script to VPS..." -ForegroundColor Yellow
$tempScript = "$env:TEMP\deploy_script.sh"
$deployScript | Out-File -FilePath $tempScript -Encoding utf8 -NoNewline

# Convert to Unix line endings
$content = Get-Content $tempScript -Raw
$content = $content -replace "`r`n", "`n"
$content = $content -replace "`r", "`n"
[System.IO.File]::WriteAllText($tempScript, $content, [System.Text.UTF8Encoding]::new($false))

# Upload and execute
scp $tempScript "${vpsUser}@${vpsIP}:/tmp/deploy_script.sh" 2>&1 | Out-Null
ssh "$vpsUser@$vpsIP" "chmod +x /tmp/deploy_script.sh && bash /tmp/deploy_script.sh"

# Cleanup
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ SUCCESS: DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is now LIVE at:" -ForegroundColor Cyan
    Write-Host "  https://www.cryptorafts.com" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "⚠️  WARNING: Exit code: $LASTEXITCODE" -ForegroundColor Yellow
    Write-Host "Check the output above for errors." -ForegroundColor Yellow
    Write-Host ""
}
