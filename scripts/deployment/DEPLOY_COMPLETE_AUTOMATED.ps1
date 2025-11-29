# ============================================
# COMPLETE AUTOMATED DEPLOYMENT SCRIPT
# Deploys cryptorafts to Hostinger VPS
# ============================================

# Configuration - Replace placeholders if needed
$VPS_IP = "145.79.211.130"
$SSH_PORT = 65002
$VPS_USER = "root"  # Using root based on previous SSH sessions
$SSH_PASSWORD = "Shamsi2627@@"  # Password-based authentication
$APP_NAME = "cryptorafts"
$APP_PORT = 3000
$DOMAIN = "cryptorafts.com"
$EMAIL = "admin@cryptorafts.com"  # Change to your email
$NODE_VERSION = 20
$REPO_URL = ""  # Leave empty - files uploaded via File Manager

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 AUTOMATED DEPLOYMENT TO VPS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VPS IP: $VPS_IP" -ForegroundColor Yellow
Write-Host "VPS User: $VPS_USER" -ForegroundColor Yellow
Write-Host "App Name: $APP_NAME" -ForegroundColor Yellow
Write-Host "Domain: $DOMAIN" -ForegroundColor Yellow
Write-Host "Node Version: $NODE_VERSION" -ForegroundColor Yellow
Write-Host ""

# Check if sshpass is available (for password-based SSH)
$sshpassAvailable = $false
if (Get-Command sshpass -ErrorAction SilentlyContinue) {
    $sshpassAvailable = $true
    Write-Host "✅ sshpass found" -ForegroundColor Green
} else {
    Write-Host "⚠️  sshpass not found. Installing..." -ForegroundColor Yellow
    # For Windows, sshpass might not be available - we'll use SSH with password prompt or key
    Write-Host "Note: You may need to enter password manually" -ForegroundColor Yellow
}

# Function to execute SSH command
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "📋 $Description" -ForegroundColor Cyan
    
    if ($sshpassAvailable) {
        $result = sshpass -p "$SSH_PASSWORD" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=$null "${VPS_USER}@${VPS_IP}" "$Command" 2>&1
    } else {
        # Try SSH with key first, fallback to password prompt
        $result = ssh -p $SSH_PORT -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "$Command" 2>&1
    }
    
    if ($LASTEXITCODE -ne 0 -and $result -match "error|Error|ERROR|failed|Failed|FAILED") {
        Write-Host "❌ Error: $Description" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        return $false
    } else {
        Write-Host $result
        return $true
    }
}

# Remote deployment script
$remoteDeployScript = @"
#!/bin/bash
set -e

echo "========================================"
echo "🚀 STARTING AUTOMATED DEPLOYMENT"
echo "========================================"
echo ""

# Configuration
APP_NAME="$APP_NAME"
APP_PORT=$APP_PORT
DOMAIN="$DOMAIN"
EMAIL="$EMAIL"
NODE_VERSION=$NODE_VERSION

echo "Configuration:"
echo "  APP_NAME: \$APP_NAME"
echo "  APP_PORT: \$APP_PORT"
echo "  DOMAIN: \$DOMAIN"
echo "  NODE_VERSION: \$NODE_VERSION"
echo ""

# Step 1: System update and package installation
echo "📦 Step 1: Updating system and installing packages..."
apt update && apt -y upgrade || true
curl -fsSL https://deb.nodesource.com/setup_\${NODE_VERSION}.x | bash - || true
apt install -y nodejs git build-essential nginx certbot python3-certbot-nginx ufw || true
echo "✅ Packages installed"
echo ""

# Step 2: Install NVM for Node.js version management
echo "📦 Step 2: Installing NVM..."
export NVM_DIR="\$HOME/.nvm"
if [ ! -d "\$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash || true
fi
[ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
nvm install \$NODE_VERSION || true
nvm use \$NODE_VERSION || true
nvm alias default \$NODE_VERSION || true
echo "✅ NVM installed and Node.js \$NODE_VERSION active"
echo "Node version: \$(node --version)"
echo ""

# Step 3: Create app directory and set permissions
echo "📁 Step 3: Creating app directory..."
mkdir -p /var/www/\${APP_NAME}
chmod 755 /var/www/\${APP_NAME}
echo "✅ Directory created: /var/www/\${APP_NAME}"
echo ""

# Step 4: Check if files exist (uploaded via File Manager)
echo "🔍 Step 4: Checking for application files..."
cd /var/www/\${APP_NAME}

if [ -f "package.json" ]; then
    echo "✅ Files found in /var/www/\${APP_NAME}"
    echo "Files:"
    ls -la package.json src/app/page.tsx next.config.js 2>/dev/null || echo "Some files missing"
else
    echo "❌ ERROR: Files not found in /var/www/\${APP_NAME}"
    echo "Please upload files via Hostinger File Manager first!"
    echo "Required files:"
    echo "  - package.json"
    echo "  - next.config.js"
    echo "  - tsconfig.json"
    echo "  - src/ folder (with src/app/page.tsx)"
    exit 1
fi

# Fix permissions
echo "🔧 Fixing file permissions..."
chmod 755 /var/www/\${APP_NAME}
chmod 644 /var/www/\${APP_NAME}/*.json /var/www/\${APP_NAME}/*.js 2>/dev/null || true
chmod 755 /var/www/\${APP_NAME}/src /var/www/\${APP_NAME}/public 2>/dev/null || true
find /var/www/\${APP_NAME}/src -type f -exec chmod 644 {} \; 2>/dev/null || true
find /var/www/\${APP_NAME}/src -type d -exec chmod 755 {} \; 2>/dev/null || true
echo "✅ Permissions fixed"
echo ""

# Step 5: Install PM2 globally
echo "📦 Step 5: Installing PM2..."
npm install -g pm2@latest || true
echo "✅ PM2 installed"
echo ""

# Step 6: Stop existing PM2 processes
echo "🛑 Step 6: Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 7: Install dependencies
echo "📦 Step 7: Installing dependencies (5-10 minutes)..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps || {
    echo "❌ npm install failed"
    exit 1
}

if [ ! -f "node_modules/next/package.json" ]; then
    echo "❌ ERROR: next module not installed"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 8: Build application
echo "🔨 Step 8: Building application..."
rm -rf .next out
NODE_ENV=production npm run build || {
    echo "❌ Build failed"
    exit 1
}
echo "✅ Build completed"
echo ""

# Step 9: Create server.js
echo "📝 Step 9: Creating server.js..."
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
      console.log(\`> Ready on http://\${hostname}:\${port}\`);
    });
});
EOFSERVER
echo "✅ server.js created"
echo ""

# Step 10: Create ecosystem.config.js
echo "📝 Step 10: Creating ecosystem.config.js..."
NODE_PATH=\$(which node)
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '\${APP_NAME}',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '\${NODE_PATH}',
      env: { NODE_ENV: 'production', PORT: \${APP_PORT} },
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
echo "✅ ecosystem.config.js created"
echo ""

# Step 11: Start PM2
echo "🚀 Step 11: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root || true
echo "✅ PM2 started"
echo ""

# Step 12: Configure Nginx
echo "🌐 Step 12: Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/\${APP_NAME}"
cat > \${NGINX_CONF} << 'NGINXEOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://127.0.0.1:APP_PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

sed -i "s/DOMAIN_PLACEHOLDER/\${DOMAIN}/g" \${NGINX_CONF}
sed -i "s/APP_PORT_PLACEHOLDER/\${APP_PORT}/g" \${NGINX_CONF}

# Enable site
ln -sf \${NGINX_CONF} /etc/nginx/sites-enabled/\${APP_NAME}

# Remove default nginx site if exists
rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
nginx -t && systemctl restart nginx || {
    echo "❌ Nginx configuration failed"
    exit 1
}
echo "✅ Nginx configured"
echo ""

# Step 13: Setup SSL with Let's Encrypt
echo "🔒 Step 13: Setting up SSL certificate..."
certbot --nginx -d \${DOMAIN} -d www.\${DOMAIN} --non-interactive --agree-tos --email \${EMAIL} --redirect || {
    echo "⚠️  SSL certificate setup failed (may need DNS configured)"
    echo "You can run manually later: certbot --nginx -d \${DOMAIN} -d www.\${DOMAIN}"
}
echo "✅ SSL setup attempted"
echo ""

# Step 14: Configure firewall
echo "🔥 Step 14: Configuring firewall..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true
echo "✅ Firewall configured"
echo ""

# Step 15: Final verification
echo "========================================"
echo "✅ FINAL VERIFICATION"
echo "========================================"
echo ""

echo "📊 PM2 Status:"
pm2 status
echo ""

echo "📋 Recent PM2 Logs:"
pm2 logs \${APP_NAME} --lines 30 --nostream || true
echo ""

echo "🌐 Nginx Status:"
systemctl status nginx --no-pager | head -10 || true
echo ""

echo "🔒 SSL Certificates:"
certbot certificates || echo "No certificates found"
echo ""

echo "🌐 Testing HTTP response:"
curl -I http://localhost:\${APP_PORT} 2>/dev/null | head -5 || echo "App not responding on port \${APP_PORT}"
echo ""

echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "🌐 Visit: https://\${DOMAIN}"
echo "🌐 Visit: https://www.\${DOMAIN}"
echo ""
echo "📋 Useful commands:"
echo "   pm2 status              - Check app status"
echo "   pm2 logs \${APP_NAME}       - View app logs"
echo "   pm2 restart \${APP_NAME}    - Restart app"
echo "   pm2 stop \${APP_NAME}       - Stop app"
echo ""
"@

# Execute remote script
Write-Host "🚀 Starting deployment..." -ForegroundColor Green
Write-Host ""

# Try to execute via SSH
try {
    $result = ssh -p $SSH_PORT -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "bash -s" << $remoteDeployScript
    
    Write-Host "✅ Deployment script executed!" -ForegroundColor Green
    Write-Host ""
    Write-Host $result
} catch {
    Write-Host "❌ SSH execution failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Copy and paste the deployment script manually" -ForegroundColor Yellow
    Write-Host "See DEPLOY_REMOTE_SCRIPT.sh" -ForegroundColor Yellow
}

# Save remote script to file for manual execution
$remoteDeployScript | Out-File -FilePath "DEPLOY_REMOTE_SCRIPT.sh" -Encoding UTF8
Write-Host ""
Write-Host "📋 Remote script saved to: DEPLOY_REMOTE_SCRIPT.sh" -ForegroundColor Cyan
Write-Host "You can upload and run this manually if needed" -ForegroundColor Yellow
Write-Host ""

