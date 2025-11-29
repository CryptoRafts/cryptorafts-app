#!/bin/bash
# ============================================
# FIND FILES AND DEPLOY - Complete Fix
# ============================================

set -e

echo "========================================"
echo "🔍 FIND FILES AND DEPLOY"
echo "========================================"
echo ""

APP_NAME="cryptorafts"
APP_PORT=3000
DOMAIN="cryptorafts.com"
EMAIL="admin@cryptorafts.com"
NODE_VERSION=20

# Step 1: Search for files
echo "🔍 Step 1: Searching for package.json..."
FOUND_PATH=$(find /var/www /home -name "package.json" -type f 2>/dev/null | grep -i cryptorafts | head -1)

if [ -z "$FOUND_PATH" ]; then
    echo "❌ ERROR: package.json NOT FOUND!"
    echo ""
    echo "Files must be uploaded via Hostinger File Manager!"
    echo "Upload to /var/www/cryptorafts:"
    echo "  - src/ folder"
    echo "  - package.json"
    echo "  - next.config.js"
    echo "  - tsconfig.json"
    exit 1
fi

# Get directory
APP_DIR=$(dirname "$FOUND_PATH")
echo "✅ Found files in: $APP_DIR"
echo ""

# If not in /var/www/cryptorafts, copy files
if [ "$APP_DIR" != "/var/www/cryptorafts" ]; then
    echo "⚠️  Files are in $APP_DIR, copying to /var/www/cryptorafts..."
    mkdir -p /var/www/cryptorafts
    cd "$APP_DIR"
    cp -r src package.json next.config.js tsconfig.json public server.js ecosystem.config.js /var/www/cryptorafts/ 2>/dev/null || true
    echo "✅ Files copied"
fi

# Navigate to deployment directory
cd /var/www/cryptorafts
echo "Current directory: $(pwd)"
echo ""

# Verify files
echo "🔍 Verifying files..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json still not found!"
    exit 1
fi

echo "✅ Files verified!"
ls -la package.json src/app/page.tsx next.config.js 2>/dev/null | head -5
echo ""

# Fix permissions
echo "🔧 Fixing permissions..."
chmod 755 /var/www/cryptorafts
find /var/www/cryptorafts -type d -exec chmod 755 {} \; 2>/dev/null || true
find /var/www/cryptorafts -type f -exec chmod 644 {} \; 2>/dev/null || true
echo "✅ Permissions fixed"
echo ""

# Load NVM
echo "📦 Loading NVM..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use $NODE_VERSION || true
NODE_PATH=$(which node)
echo "✅ Using Node.js: $NODE_PATH ($(node --version))"
echo ""

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Install dependencies
echo "📦 Installing dependencies (5-10 minutes)..."
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

# Start PM2
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root || true

# Configure Nginx
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

ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/${APP_NAME}
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx || {
    echo "❌ Nginx failed"
    exit 1
}

# SSL
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect || {
    echo "⚠️  SSL failed (may need DNS)"
}

# Firewall
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

# Verification
echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "🌐 Visit: https://${DOMAIN}"
echo ""

