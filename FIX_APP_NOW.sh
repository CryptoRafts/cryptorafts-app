#!/bin/bash
# ============================================
# 🔧 FIX APP - COMPLETE FIX SCRIPT
# ============================================
# Run this on VPS to fix all app issues

set -e

APP_DIR="/var/www/cryptorafts"
USER="u386122906"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🔧 FIXING APP - COMPLETE FIX 🔧                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Navigate to app directory
echo "[1/8] Navigating to app directory..."
cd ~/cryptorafts 2>/dev/null || cd /var/www/cryptorafts 2>/dev/null || { echo "❌ App directory not found!"; exit 1; }
APP_DIR=$(pwd)
echo "✅ In directory: $APP_DIR"

# Step 2: Fix permissions
echo ""
echo "[2/8] Fixing permissions..."
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
echo "✅ Permissions fixed"

# Step 3: Check if dependencies are installed
echo ""
echo "[3/8] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production 2>&1 | tail -20
else
    echo "✅ Dependencies found"
fi

# Step 4: Check if app is built
echo ""
echo "[4/8] Checking if app is built..."
if [ ! -d ".next" ]; then
    echo "Building application..."
    npm run build 2>&1 | tail -30
else
    echo "✅ App is built"
fi

# Step 5: Ensure server.js exists
echo ""
echo "[5/8] Checking server.js..."
if [ ! -f "server.js" ]; then
    echo "Creating server.js..."
    cat > server.js << 'EOF'
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
EOF
    echo "✅ server.js created"
else
    echo "✅ server.js exists"
fi

# Step 6: Start/Restart app with PM2
echo ""
echo "[6/8] Starting/Restarting app with PM2..."
mkdir -p logs

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Stop existing app
if pm2 list | grep -q cryptorafts; then
    echo "Stopping existing app..."
    pm2 stop cryptorafts
    pm2 delete cryptorafts
fi

# Start app
echo "Starting app..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
elif [ -f "server.js" ]; then
    pm2 start server.js --name cryptorafts
else
    echo "❌ No server file found!"
    exit 1
fi

pm2 save
echo "✅ App running with PM2"

# Step 7: Verify app is responding
echo ""
echo "[7/8] Verifying app is responding..."
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App responding on port 3000"
else
    echo "⚠️  App not responding yet. Check logs:"
    pm2 logs cryptorafts --lines 20 --nostream
    echo "⚠️  Continuing anyway..."
fi

# Step 8: Fix Nginx configuration
echo ""
echo "[8/8] Fixing Nginx configuration..."
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
if [ ! -L "/etc/nginx/sites-enabled/cryptorafts" ]; then
    sudo ln -s /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/
fi

# Test and reload Nginx
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
else
    echo "⚠️  Nginx config test failed, but continuing..."
fi

# Final verification
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "PM2 Status:"
pm2 status

echo ""
echo "App Response:"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App responding on port 3000"
    curl -I http://localhost:3000 2>/dev/null | head -3
else
    echo "❌ App not responding"
    echo "Check logs: pm2 logs cryptorafts"
fi

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -3

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ FIX COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 If app is still not working:"
echo "   1. Check: pm2 logs cryptorafts"
echo "   2. Check: sudo tail -50 /var/log/nginx/error.log"
echo "   3. Verify: curl http://localhost:3000"
echo "   4. Restart: pm2 restart cryptorafts"
echo "   5. Restart Nginx: sudo systemctl restart nginx"
echo ""

