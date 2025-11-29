#!/bin/bash
# ============================================
# 🔧 COMPLETE FIX FOR MIME TYPE ERROR
# ============================================
# This fixes JavaScript files being served as HTML

set -e

APP_DIR="/var/www/cryptorafts"
USER="u386122906"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🔧 COMPLETE FIX FOR MIME TYPE ERROR 🔧                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check and navigate to app directory
echo "[1/8] Checking app directory..."
if [ ! -d "$APP_DIR" ]; then
    echo "⚠️  App directory not found. Creating..."
    sudo mkdir -p $APP_DIR
fi

cd $APP_DIR || { echo "❌ Cannot access directory: $APP_DIR"; exit 1; }
echo "✅ In directory: $APP_DIR"

# Step 2: Fix permissions
echo ""
echo "[2/8] Fixing permissions..."
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
echo "✅ Permissions fixed"

# Step 3: Check if node_modules exists
echo ""
echo "[3/8] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Installing..."
    npm install --production
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies found"
fi

# Step 4: Check if app is built
echo ""
echo "[4/8] Checking if app is built..."
if [ ! -d ".next" ]; then
    echo "⚠️  App not built. Building now..."
    echo "⏱️  This will take 2-3 minutes..."
    npm run build
    echo "✅ Build complete"
else
    echo "✅ App is built"
fi

# Step 5: Check if static files exist
echo ""
echo "[5/8] Checking static files..."
if [ -d ".next/static" ]; then
    echo "✅ Static files found"
    ls -la .next/static/chunks/ 2>/dev/null | head -5 || echo "⚠️  Chunks directory might be empty"
else
    echo "❌ Static files not found! Rebuilding..."
    npm run build
fi

# Step 6: Ensure server.js exists
echo ""
echo "[6/8] Checking server.js..."
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

# Step 7: Start/Restart app with PM2
echo ""
echo "[7/8] Starting/Restarting app with PM2..."
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

# Wait a bit
sleep 2

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
echo "✅ App started with PM2"

# Wait for app to start
echo "Waiting for app to start..."
sleep 10

# Verify app is responding
echo "Verifying app is responding..."
for i in {1..5}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ App responding on port 3000"
        break
    else
        echo "⚠️  App not responding yet (attempt $i/5)..."
        sleep 3
    fi
done

# Check app logs
echo ""
echo "App logs (last 10 lines):"
pm2 logs cryptorafts --lines 10 --nostream

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

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # CRITICAL: Proxy ALL requests to Next.js app
    # Next.js will handle static files with correct MIME types
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
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
if [ ! -L "/etc/nginx/sites-enabled/cryptorafts" ]; then
    sudo ln -s /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/
fi

# Test Nginx config
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
else
    echo "❌ Nginx config test failed"
    sudo nginx -t
    exit 1
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
echo "Testing app locally:"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App responding on port 3000"
    curl -I http://localhost:3000 2>/dev/null | head -3
else
    echo "❌ App not responding on port 3000"
    echo "Check logs: pm2 logs cryptorafts"
fi

echo ""
echo "Testing static file:"
STATIC_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$STATIC_FILE" ]; then
    FILE_NAME=$(basename $STATIC_FILE)
    echo "Testing: /_next/static/chunks/$FILE_NAME"
    curl -I "http://localhost:3000/_next/static/chunks/$FILE_NAME" 2>/dev/null | head -5
else
    echo "⚠️  No static files found"
fi

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -3

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ FIX COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "   1. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "   2. Hard refresh: Ctrl+F5 or Ctrl+Shift+R"
echo "   3. Visit: https://www.cryptorafts.com"
echo ""
echo "📋 If still seeing errors:"
echo "   1. Check: pm2 logs cryptorafts"
echo "   2. Check: sudo tail -50 /var/log/nginx/error.log"
echo "   3. Verify app is running: curl http://localhost:3000"
echo "   4. Restart app: pm2 restart cryptorafts"
echo ""

