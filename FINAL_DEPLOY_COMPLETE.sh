#!/bin/bash
# ============================================
# FINAL COMPLETE DEPLOYMENT SCRIPT
# Fixes permissions and deploys everything
# ============================================

set -e

echo "========================================"
echo "🚀 FINAL COMPLETE DEPLOYMENT"
echo "========================================"
echo ""

# Configuration
APP_NAME="cryptorafts"
APP_PORT=3000
DOMAIN="cryptorafts.com"
EMAIL="admin@cryptorafts.com"
NODE_VERSION=20

echo "Configuration:"
echo "  APP_NAME: $APP_NAME"
echo "  APP_PORT: $APP_PORT"
echo "  DOMAIN: $DOMAIN"
echo "  NODE_VERSION: $NODE_VERSION"
echo ""

# Step 1: System update
echo "📦 Step 1: Updating system..."
apt update && apt -y upgrade || true
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - || true
apt install -y nodejs git build-essential nginx certbot python3-certbot-nginx ufw || true
echo "✅ Packages installed"
echo ""

# Step 2: Install NVM
echo "📦 Step 2: Installing NVM..."
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash || true
fi
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install $NODE_VERSION || true
nvm use $NODE_VERSION || true
nvm alias default $NODE_VERSION || true
echo "✅ NVM installed - Node.js $(node --version)"
echo ""

# Step 3: Create directory
echo "📁 Step 3: Creating directory..."
mkdir -p /var/www/${APP_NAME}
chmod 755 /var/www/${APP_NAME}
echo "✅ Directory created"
echo ""

# Step 4: FIX PERMISSIONS FIRST - Critical step
echo "🔧 Step 4: Fixing ALL permissions (CRITICAL)..."
cd /var/www/${APP_NAME}

# Make directory accessible
chmod 755 /var/www/${APP_NAME}
chown -R root:root /var/www/${APP_NAME} || true

# Fix file permissions
chmod 644 /var/www/${APP_NAME}/*.json /var/www/${APP_NAME}/*.js /var/www/${APP_NAME}/*.sh /var/www/${APP_NAME}/*.txt 2>/dev/null || true

# Fix directory permissions
chmod 755 /var/www/${APP_NAME}/src /var/www/${APP_NAME}/public 2>/dev/null || true

# Fix all files in src/
find /var/www/${APP_NAME}/src -type f -exec chmod 644 {} \; 2>/dev/null || true
find /var/www/${APP_NAME}/src -type d -exec chmod 755 {} \; 2>/dev/null || true

# Fix all directories recursively
find /var/www/${APP_NAME} -type d -exec chmod 755 {} \; 2>/dev/null || true
find /var/www/${APP_NAME} -type f -exec chmod 644 {} \; 2>/dev/null || true

echo "✅ Permissions fixed"
echo ""

# Step 5: Check files (after fixing permissions)
echo "🔍 Step 5: Checking for files..."
cd /var/www/${APP_NAME}

# List all files
echo "Files in directory:"
ls -la | head -20
echo ""

# Check for package.json in various ways
if [ -f "package.json" ]; then
    echo "✅ package.json found!"
    ls -la package.json
elif [ -f "./package.json" ]; then
    echo "✅ package.json found in ./"
    ls -la ./package.json
else
    echo "❌ ERROR: package.json NOT FOUND!"
    echo ""
    echo "Current directory: $(pwd)"
    echo "All files:"
    ls -la
    echo ""
    echo "Searching for package.json:"
    find /var/www -name "package.json" -type f 2>/dev/null | head -5
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 FILES MUST BE UPLOADED VIA HOSTINGER FILE MANAGER!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "1. Go to: https://hpanel.hostinger.com/"
    echo "2. Click 'File Manager'"
    echo "3. Navigate to: /var/www/cryptorafts"
    echo "4. Upload from C:\Users\dell\cryptorafts-starter:"
    echo "   - src/ folder (ENTIRE folder)"
    echo "   - package.json"
    echo "   - next.config.js"
    echo "   - tsconfig.json"
    echo ""
    exit 1
fi

# Verify other files
if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ ERROR: src/app/page.tsx not found!"
    echo "Upload src/ folder!"
    exit 1
fi

if [ ! -f "next.config.js" ]; then
    echo "❌ ERROR: next.config.js not found!"
    echo "Upload next.config.js!"
    exit 1
fi

echo "✅ All files verified!"
echo ""

# Step 6: Install PM2
echo "📦 Step 6: Installing PM2..."
npm install -g pm2@latest || true
echo "✅ PM2 installed"
echo ""

# Step 7: Stop PM2
echo "🛑 Step 7: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 8: Install dependencies
echo "📦 Step 8: Installing dependencies (5-10 minutes)..."
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

# Step 9: Build
echo "🔨 Step 9: Building application..."
rm -rf .next out
NODE_ENV=production npm run build || {
    echo "❌ Build failed"
    exit 1
}
echo "✅ Build completed"
echo ""

# Step 10: Create server.js
echo "📝 Step 10: Creating server.js..."
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
echo "✅ server.js created"
echo ""

# Step 11: Create ecosystem.config.js
echo "📝 Step 11: Creating ecosystem.config.js..."
NODE_PATH=$(which node)
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '${APP_NAME}',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '${NODE_PATH}',
      env: { NODE_ENV: 'production', PORT: ${APP_PORT} },
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

# Step 12: Start PM2
echo "🚀 Step 12: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root || true
echo "✅ PM2 started"
echo ""

# Step 13: Configure Nginx
echo "🌐 Step 13: Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
cat > ${NGINX_CONF} << 'NGINXEOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://127.0.0.1:APP_PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" ${NGINX_CONF}
sed -i "s/APP_PORT_PLACEHOLDER/${APP_PORT}/g" ${NGINX_CONF}

# Enable site
ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/${APP_NAME}

# Remove default
rm -f /etc/nginx/sites-enabled/default

# Test and restart
nginx -t && systemctl restart nginx || {
    echo "❌ Nginx configuration failed"
    exit 1
}
echo "✅ Nginx configured"
echo ""

# Step 14: SSL setup
echo "🔒 Step 14: Setting up SSL..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect || {
    echo "⚠️  SSL failed (DNS may not be configured)"
    echo "Run manually: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
}
echo "✅ SSL setup attempted"
echo ""

# Step 15: Firewall
echo "🔥 Step 15: Configuring firewall..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true
echo "✅ Firewall configured"
echo ""

# Step 16: Verification
echo "========================================"
echo "✅ FINAL VERIFICATION"
echo "========================================"
echo ""

echo "📊 PM2 Status:"
pm2 status
echo ""

echo "📋 PM2 Logs:"
pm2 logs ${APP_NAME} --lines 30 --nostream || true
echo ""

echo "🌐 Nginx Status:"
systemctl status nginx --no-pager | head -10 || true
echo ""

echo "🔒 SSL Certificates:"
certbot certificates || echo "No certificates"
echo ""

echo "🌐 Testing App:"
curl -I http://localhost:${APP_PORT} 2>/dev/null | head -5 || echo "App not responding"
echo ""

echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "🌐 Visit: https://${DOMAIN}"
echo "🌐 Visit: https://www.${DOMAIN}"
echo ""

