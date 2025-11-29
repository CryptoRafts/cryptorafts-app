#!/bin/bash
# ============================================
# RUN AFTER UPLOAD COMPLETES
# Verifies files and deploys
# ============================================

set -e

echo "========================================"
echo "🚀 POST-UPLOAD DEPLOYMENT"
echo "========================================"
echo ""

cd /var/www/cryptorafts

# Step 1: Verify files uploaded
echo "📋 Step 1: Verifying uploaded files..."
FILE_COUNT=$(find src -type f 2>/dev/null | wc -l)
echo "Files in src/: $FILE_COUNT"

if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json NOT FOUND!"
    echo "Wait for upload to complete or re-upload package.json"
    exit 1
fi

if [ "$FILE_COUNT" -lt 100 ]; then
    echo "⚠️  WARNING: Only $FILE_COUNT files found"
    echo "Upload may still be in progress..."
    echo ""
    echo "Please wait for upload to complete (~20 minutes)"
    echo "Then run this command again"
    exit 1
fi

if [ "$FILE_COUNT" -lt 500 ]; then
    echo "⚠️  WARNING: Only $FILE_COUNT files found (expected 700+)"
    echo "Some files may be missing - continuing anyway..."
fi

echo "✅ Files verified ($FILE_COUNT files in src/)"
echo ""

# Step 2: Fix ownership
echo "🔧 Step 2: Fixing ownership..."
chown -R root:root /var/www/cryptorafts
chmod -R 755 /var/www/cryptorafts
find /var/www/cryptorafts -type f -exec chmod 644 {} \; 2>/dev/null || true
rm -f /var/www/package-lock.json 2>/dev/null || true
echo "✅ Ownership fixed"
echo ""

# Step 3: Stop PM2
echo "🛑 Step 3: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 4: Load NVM
echo "📦 Step 4: Loading NVM..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 || true
NODE_PATH=$(which node)
echo "✅ Using Node.js: $NODE_PATH ($(node --version))"
echo ""

# Step 5: Clean and install dependencies
echo "📦 Step 5: Installing dependencies (10-15 minutes)..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps || {
    echo "❌ npm install failed"
    exit 1
}
echo "✅ Dependencies installed"
echo ""

# Step 6: Build
echo "🔨 Step 6: Building application..."
rm -rf .next out
NODE_ENV=production npm run build || {
    echo "❌ Build failed"
    exit 1
}
echo "✅ Build completed"
echo ""

# Step 7: Create server.js
echo "📝 Step 7: Creating server.js..."
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

# Step 8: Create ecosystem.config.js
NODE_PATH=$(which node)
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '${NODE_PATH}',
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

# Step 9: Start PM2
echo "🚀 Step 9: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root || true
echo "✅ PM2 started"
echo ""

# Step 10: Verify Nginx
echo "🌐 Step 10: Verifying Nginx..."
if ! nginx -t 2>/dev/null; then
    echo "⚠️  Nginx config issue - fixing..."
    NGINX_CONF="/etc/nginx/sites-available/cryptorafts"
    cat > ${NGINX_CONF} << 'NGINXEOF'
server {
    listen 80;
    server_name cryptorafts.com www.cryptorafts.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
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
    ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/cryptorafts
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx || true
fi
echo "✅ Nginx configured"
echo ""

# Step 11: Verification
echo "========================================"
echo "✅ VERIFICATION"
echo "========================================"
echo ""

echo "📊 PM2 Status:"
pm2 status
echo ""

echo "📋 PM2 Logs (last 10 lines):"
pm2 logs cryptorafts --lines 10 --nostream || true
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
echo "📊 File count: $FILE_COUNT files in src/"
echo ""

