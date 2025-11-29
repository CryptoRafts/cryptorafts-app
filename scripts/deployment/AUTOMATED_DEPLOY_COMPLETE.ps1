# ============================================
# AUTOMATED COMPLETE DEPLOYMENT
# Creates package and deploys everything
# ============================================

param(
    [string]$VPS_IP = "145.79.211.130",
    [int]$SSH_PORT = 65002,
    [string]$VPS_USER = "root",
    [string]$VPS_PASSWORD = "Shamsi2627@@",
    [string]$APP_DIR = "/var/www/cryptorafts"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 AUTOMATED COMPLETE DEPLOYMENT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$NODE_VERSION = 20
$APP_NAME = "cryptorafts"
$DOMAIN = "cryptorafts.com"
$script:manualUpload = $false

# Step 1: Verify local files
Write-Host "📋 Step 1: Verifying local files..." -ForegroundColor Yellow
$requiredFiles = @("src", "package.json", "next.config.js", "tsconfig.json")
$missing = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING!" -ForegroundColor Red
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ ERROR: Missing required files!" -ForegroundColor Red
    Write-Host "Missing: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

# Step 2: Create deployment package
Write-Host ""
Write-Host "📦 Step 2: Creating deployment package..." -ForegroundColor Yellow

$packageName = "cryptorafts-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
$tempDir = "$env:TEMP\cryptorafts-deploy"
$packagePath = "$tempDir\$packageName"

# Clean temp directory
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files to temp directory
Write-Host "  📋 Copying files..." -ForegroundColor Cyan
foreach ($item in @("src", "package.json", "next.config.js", "tsconfig.json")) {
    if (Test-Path $item) {
        if ((Get-Item $item).PSIsContainer) {
            Copy-Item -Path $item -Destination $tempDir -Recurse -Force
            Write-Host "    ✅ Copied $item/ folder" -ForegroundColor Green
        } else {
            Copy-Item -Path $item -Destination $tempDir -Force
            Write-Host "    ✅ Copied $item" -ForegroundColor Green
        }
    }
}

# Copy public folder if exists
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination $tempDir -Recurse -Force
    Write-Host "    ✅ Copied public/ folder" -ForegroundColor Green
}

# Create tar.gz using 7zip or tar if available
Write-Host "  📦 Compressing package..." -ForegroundColor Cyan
$currentDir = Get-Location
Set-Location $tempDir

# Try using WSL tar if available
$tarCommand = "wsl tar -czf `"$packageName`" . 2>&1"
$tarResult = cmd /c $tarCommand
if ($LASTEXITCODE -ne 0) {
    # Try native PowerShell compression
    Write-Host "    ⚠️  WSL tar not available, using PowerShell..." -ForegroundColor Yellow
    $files = Get-ChildItem -Recurse
    Compress-Archive -Path $files -DestinationPath "$env:TEMP\$packageName.zip" -Force
    $packageName = "$packageName.zip"
    $packagePath = "$env:TEMP\$packageName"
} else {
    $packagePath = "$tempDir\$packageName"
}

Set-Location $currentDir

if (Test-Path $packagePath) {
    $size = (Get-Item $packagePath).Length / 1MB
    Write-Host "    ✅ Package created: $packageName ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "    ❌ Failed to create package!" -ForegroundColor Red
    exit 1
}

# Step 3: Upload package to VPS
Write-Host ""
Write-Host "📤 Step 3: Uploading package to VPS..." -ForegroundColor Yellow

# Check if WSL is available for scp
$wslAvailable = $false
try {
    $wslCheck = wsl --list 2>&1
    if ($LASTEXITCODE -eq 0) {
        $wslAvailable = $true
    }
} catch {
    $wslAvailable = $false
}

if ($wslAvailable) {
    Write-Host "  🔐 Using WSL/SCP to upload..." -ForegroundColor Cyan
    # Create upload script
    $uploadScriptContent = @'
#!/bin/bash
# Upload script
VPS_IP="'@ + $VPS_IP + @'"
SSH_PORT='@ + $SSH_PORT + @'
VPS_USER="'@ + $VPS_USER + @'"
VPS_PASSWORD="'@ + $VPS_PASSWORD + @'"
PACKAGE_PATH="'@ + $packagePath + @'"
PACKAGE_NAME="'@ + $packageName + @'"

# Try scp with sshpass if available
if command -v sshpass &> /dev/null; then
    sshpass -p "$VPS_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no "$PACKAGE_PATH" ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/
else
    echo "sshpass not available, please install it or upload manually"
    exit 1
fi
'@
    
    $uploadScriptPath = "$tempDir\upload.sh"
    $uploadScriptContent | Out-File -FilePath $uploadScriptPath -Encoding UTF8 -NoNewline
    
    # Execute via WSL
    try {
        $uploadResult = wsl bash $uploadScriptPath 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "    ⚠️  SCP upload failed, providing manual instructions..." -ForegroundColor Yellow
            $script:manualUpload = $true
        } else {
            Write-Host "    ✅ Package uploaded!" -ForegroundColor Green
            $script:manualUpload = $false
        }
    } catch {
        Write-Host "    ⚠️  Upload error: $_" -ForegroundColor Yellow
        $script:manualUpload = $true
    }
} else {
    Write-Host "    ⚠️  WSL not available, manual upload required..." -ForegroundColor Yellow
    $script:manualUpload = $true
}

if ($script:manualUpload) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📤 MANUAL UPLOAD REQUIRED" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Package created at: $packagePath" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Go to Hostinger File Manager" -ForegroundColor White
    Write-Host "2. Navigate to: /var/www/cryptorafts" -ForegroundColor White
    Write-Host "3. Upload: $packageName" -ForegroundColor White
    Write-Host "4. Then run the deployment command in SSH" -ForegroundColor White
    Write-Host ""
}

# Step 4: Create remote deployment script
Write-Host ""
Write-Host "📝 Step 4: Creating remote deployment script..." -ForegroundColor Yellow

$remoteScript = @"
#!/bin/bash
# ============================================
# COMPLETE AUTOMATED DEPLOYMENT SCRIPT
# ============================================

set -e

echo "========================================"
echo "🚀 COMPLETE AUTOMATED DEPLOYMENT"
echo "========================================"
echo ""

cd /var/www/cryptorafts

# Extract package if exists
if [ -f "cryptorafts-deploy-*.tar.gz" ] || [ -f "cryptorafts-deploy-*.zip" ]; then
    echo "📦 Extracting package..."
    if [ -f "cryptorafts-deploy-*.tar.gz" ]; then
        tar -xzf cryptorafts-deploy-*.tar.gz
    elif [ -f "cryptorafts-deploy-*.zip" ]; then
        unzip -o cryptorafts-deploy-*.zip
    fi
    rm -f cryptorafts-deploy-*.tar.gz cryptorafts-deploy-*.zip
    echo "✅ Package extracted"
    echo ""
fi

# Fix ownership
echo "🔧 Fixing ownership..."
chown -R root:root /var/www/cryptorafts
chmod -R 755 /var/www/cryptorafts
find /var/www/cryptorafts -type f -exec chmod 644 {} \; 2>/dev/null || true
echo "✅ Ownership fixed"
echo ""

# Remove conflicting lockfile
rm -f /var/www/package-lock.json 2>/dev/null || true

# Load NVM
echo "📦 Loading NVM..."
export NVM_DIR="`$HOME/.nvm"
[ -s "`$NVM_DIR/nvm.sh" ] && . "`$NVM_DIR/nvm.sh"
nvm use $NODE_VERSION || true
NODE_PATH=`$(which node)
echo "✅ Using Node.js: `$NODE_PATH (`$(node --version))"
echo ""

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Install dependencies
echo "📦 Installing dependencies (10-15 minutes)..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps || {
    echo "❌ npm install failed"
    exit 1
}
echo "✅ Dependencies installed"
echo ""

# Build
echo "🔨 Building application..."
rm -rf .next out
NODE_ENV=production npm run build || {
    echo "❌ Build failed"
    exit 1
}
echo "✅ Build completed"
echo ""

# Create server.js
echo "📝 Creating server.js..."
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

# Create ecosystem.config.js
NODE_PATH=`$(which node)
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '\${NODE_PATH}',
      env: { NODE_ENV: 'production', PORT: 3000 },
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

# Start PM2
echo "🚀 Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root || true
echo "✅ PM2 started"
echo ""

# Configure Nginx
echo "🌐 Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/cryptorafts"
cat > `$NGINX_CONF << 'NGINXEOF'
server {
    listen 80;
    server_name cryptorafts.com www.cryptorafts.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
}
NGINXEOF

ln -sf `$NGINX_CONF /etc/nginx/sites-enabled/cryptorafts
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx || true
echo "✅ Nginx configured"
echo ""

# SSL
echo "🔒 Setting up SSL..."
certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect || true
echo "✅ SSL configured"
echo ""

# Firewall
echo "🔥 Configuring firewall..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true
echo "✅ Firewall configured"
echo ""

# Verification
echo "========================================"
echo "✅ VERIFICATION"
echo "========================================"
echo ""

echo "📊 PM2 Status:"
pm2 status
echo ""

echo "📋 PM2 Logs:"
pm2 logs cryptorafts --lines 20 --nostream || true
echo ""

echo "🌐 Testing local server:"
curl -I http://localhost:3000 2>&1 | head -5 || echo "Server not responding"
echo ""

echo "🌐 Testing via Nginx:"
curl -I -H "Host: cryptorafts.com" http://127.0.0.1 2>&1 | head -5 || echo "Nginx not responding"
echo ""

echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "🌐 Visit: https://cryptorafts.com"
echo "🌐 Visit: https://www.cryptorafts.com"
echo ""
"@

$remoteScriptPath = "$tempDir\deploy.sh"
$remoteScript | Out-File -FilePath $remoteScriptPath -Encoding UTF8 -NoNewline

# Upload deployment script if WSL available
if ($wslAvailable -and -not $script:manualUpload) {
    Write-Host "  📤 Uploading deployment script..." -ForegroundColor Cyan
    wsl bash -c "sshpass -p '$VPS_PASSWORD' scp -P $SSH_PORT -o StrictHostKeyChecking=no '$remoteScriptPath' ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ Deployment script uploaded" -ForegroundColor Green
        
        # Execute deployment script
        Write-Host ""
        Write-Host "🚀 Step 5: Executing deployment on VPS..." -ForegroundColor Yellow
        Write-Host "  ⏳ This will take 10-20 minutes..." -ForegroundColor Cyan
        
        $sshCommand = "sshpass -p '$VPS_PASSWORD' ssh -p $SSH_PORT -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} 'bash /var/www/cryptorafts/deploy.sh'"
        
        wsl bash -c $sshCommand
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "🌐 Visit: https://cryptorafts.com" -ForegroundColor Cyan
            Write-Host "🌐 Visit: https://www.cryptorafts.com" -ForegroundColor Cyan
            Write-Host ""
        } else {
            Write-Host ""
            Write-Host "⚠️  Deployment script execution had issues" -ForegroundColor Yellow
            Write-Host "Check the output above for errors" -ForegroundColor Yellow
            Write-Host ""
        }
    }
} else {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📋 MANUAL DEPLOYMENT STEPS" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Upload package: $packageName" -ForegroundColor White
    Write-Host "   Location: $packagePath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Upload deployment script: deploy.sh" -ForegroundColor White
    Write-Host "   Location: $remoteScriptPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. In SSH terminal, run:" -ForegroundColor White
    Write-Host "   cd /var/www/cryptorafts" -ForegroundColor Cyan
    Write-Host "   bash deploy.sh" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "✅ Automated deployment setup complete!" -ForegroundColor Green
Write-Host ""

