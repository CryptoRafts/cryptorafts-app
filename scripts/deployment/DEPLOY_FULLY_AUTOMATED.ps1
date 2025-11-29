# Fully Automated Deployment Script for Hostinger VPS
# Handles everything automatically including file upload and deployment

param(
    [string]$VPS_IP = "145.79.211.130",
    [int]$SSH_PORT = 65002,
    [string]$SSH_USER = "u386122906",
    [string]$SSH_PASSWORD = "Shamsi2627@@"
)

Write-Host "`n🚀 FULLY AUTOMATED DEPLOYMENT - HOSTINGER VPS`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Step 1: Verify local files
Write-Host "📋 STEP 1: Verifying local files...`n" -ForegroundColor Yellow
$deployToVpsPath = "DEPLOY_TO_VPS"
if (-not (Test-Path $deployToVpsPath)) {
    Write-Host "❌ ERROR: DEPLOY_TO_VPS folder not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$deployToVpsPath\package.json")) {
    Write-Host "❌ ERROR: package.json not found in DEPLOY_TO_VPS!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$deployToVpsPath\src\app\page.tsx")) {
    Write-Host "❌ ERROR: src/app/page.tsx not found in DEPLOY_TO_VPS!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All local files verified!`n" -ForegroundColor Green

# Step 2: Check if WSL or SSH tools available
Write-Host "📋 STEP 2: Checking SSH tools...`n" -ForegroundColor Yellow
$wslAvailable = $false
$sshToolsAvailable = $false

try {
    wsl --list 2>&1 | Out-Null
    $wslAvailable = $true
    Write-Host "✅ WSL detected`n" -ForegroundColor Green
} catch {
    $wslAvailable = $false
}

# Step 3: Create deployment script
Write-Host "📋 STEP 3: Creating deployment script...`n" -ForegroundColor Yellow

# Read existing DEPLOY_VPS.sh or create new one
if (Test-Path "DEPLOY_VPS.sh") {
    $deployScript = Get-Content "DEPLOY_VPS.sh" -Raw
} else {
    # Create deployment script content
    $deployScript = Get-Content "DEPLOY_VPS.sh" -Raw -ErrorAction SilentlyContinue
    if (-not $deployScript) {
        # Create script directly as file
        @'
#!/bin/bash
set -e

echo "🚀 COMPLETE AUTOMATED DEPLOYMENT"
echo "=================================="

# Step 1: Navigate to app directory
echo "📁 Step 1: Navigating to app directory..."
cd /var/www/cryptorafts || {
    echo "Creating /var/www/cryptorafts..."
    sudo mkdir -p /var/www/cryptorafts
    sudo chown -R \$USER:\$USER /var/www/cryptorafts
    cd /var/www/cryptorafts
}

# Step 2: Check if files exist
echo ""
echo "🔍 Step 2: Checking for files..."
if [ ! -f "package.json" ] || [ ! -f "src/app/page.tsx" ]; then
    echo "❌ ERROR: Required files missing!"
    echo "Files need to be uploaded first!"
    exit 1
fi

echo "✅ Files found!"

# Step 3: Install NVM and Node.js 20
echo ""
echo "📦 Step 3: Installing NVM and Node.js 20..."
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    if ! nvm use 20 2>/dev/null; then
        nvm install 20
        nvm use 20
    fi
else
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
fi

node --version
npm --version

# Step 4: Install dependencies
echo ""
echo "📦 Step 4: Installing dependencies..."
npm install --legacy-peer-deps || {
    echo "❌ npm install failed!"
    exit 1
}

echo "✅ Dependencies installed!"

# Step 5: Build the app
echo ""
echo "🏗️  Step 5: Building app..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

echo "✅ Build completed!"

# Step 6: Create server.js
echo ""
echo "📝 Step 6: Creating server.js..."
cat > server.js << 'EOFSERVER'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
EOFSERVER

# Step 7: Create ecosystem.config.js
echo ""
echo "📝 Step 7: Creating ecosystem.config.js..."
NODE_PATH=$(which node)
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '$NODE_PATH',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
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
    },
  ],
};
EOF

# Step 8: Stop old PM2 processes
echo ""
echo "🔄 Step 8: Stopping old PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

# Step 9: Start PM2
echo ""
echo "🚀 Step 9: Starting PM2..."
mkdir -p logs

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

pm2 start ecosystem.config.js || {
    echo "❌ PM2 start failed!"
    pm2 logs cryptorafts --lines 20 --nostream
    exit 1
}

pm2 save
pm2 status

# Step 10: Verify
echo ""
echo "✅ Step 10: Verifying deployment..."
sleep 5
pm2 logs cryptorafts --lines 20 --nostream

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"
'@

$deployScript | Out-File -FilePath "DEPLOY_AUTO.sh" -Encoding UTF8 -NoNewline
Write-Host "✅ Deployment script created: DEPLOY_AUTO.sh`n" -ForegroundColor Green

# Step 4: Upload files and run deployment
if ($wslAvailable) {
    Write-Host "📋 STEP 4: Uploading files and deploying...`n" -ForegroundColor Yellow
    
    # Install sshpass for password authentication if needed
    Write-Host "📦 Checking SSH tools...`n" -ForegroundColor Cyan
    
    # Create a script to upload files using sshpass
    $uploadScript = @'
#!/bin/bash
# Upload files to VPS

VPS_IP="'@ + $VPS_IP + @'"
SSH_PORT='@ + $SSH_PORT + @'
SSH_USER="'@ + $SSH_USER + @'"
SSH_PASSWORD="'@ + $SSH_PASSWORD + @'"

echo "📤 Uploading files to VPS..."

# Install sshpass if not available
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    sudo apt-get update -qq
    sudo apt-get install -y sshpass
fi

# Create directory on VPS
sshpass -p "$SSH_PASSWORD" ssh -p $SSH_PORT -o StrictHostKeyChecking=no ${SSH_USER}@${VPS_IP} "sudo mkdir -p /var/www/cryptorafts && sudo chown -R ${SSH_USER}:${SSH_USER} /var/www/cryptorafts" || true

# Upload files
cd DEPLOY_TO_VPS
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no -r src ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/ || exit 1
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no package.json ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/ || exit 1
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no next.config.js ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/ || exit 1
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no tsconfig.json ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/ || exit 1

if [ -d "public" ]; then
    sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no -r public ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/ || true
fi

# Upload deployment script
cd ..
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no DEPLOY_AUTO.sh ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/ || exit 1

echo "✅ Files uploaded!"

# Run deployment script
echo "🚀 Running deployment script..."
sshpass -p "$SSH_PASSWORD" ssh -p $SSH_PORT -o StrictHostKeyChecking=no ${SSH_USER}@${VPS_IP} "cd /var/www/cryptorafts && bash DEPLOY_AUTO.sh"

echo "✅ Deployment complete!"
'@

    $uploadScript | Out-File -FilePath "upload_and_deploy.sh" -Encoding UTF8 -NoNewline
    
    Write-Host "🚀 Starting automated file upload and deployment...`n" -ForegroundColor Green
    Write-Host "This will take 15-20 minutes. Please wait...`n" -ForegroundColor Yellow
    
    # Make script executable and run it
    wsl bash -c "chmod +x upload_and_deploy.sh && bash upload_and_deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ DEPLOYMENT COMPLETE!`n" -ForegroundColor Green
        Write-Host "🌐 Visit: https://www.cryptorafts.com`n" -ForegroundColor Cyan
    } else {
        Write-Host "`n⚠️  Automated deployment encountered issues.`n" -ForegroundColor Yellow
        Write-Host "📋 Please use manual deployment (see DEPLOYMENT_INSTRUCTIONS.txt)`n" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  WSL not available. Using manual deployment.`n" -ForegroundColor Yellow
    Write-Host "📋 See DEPLOYMENT_INSTRUCTIONS.txt for manual steps`n" -ForegroundColor Cyan
}

Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

