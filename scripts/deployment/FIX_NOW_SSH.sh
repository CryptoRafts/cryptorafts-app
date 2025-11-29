#!/bin/bash
# ============================================
# COMPLETE FIX - RUN IN SSH TERMINAL
# ============================================
# Copy and paste this ENTIRE script into your SSH terminal

set -e

APP_DIR="$HOME/cryptorafts"
USER="u386122906"

echo ""
echo "======================================================"
echo "  COMPLETE FIX - DIAGNOSTIC AND DEPLOYMENT"
echo "======================================================"
echo ""

# Step 1: Check current directory
echo "[1/8] Checking directories..."
echo "Current directory: $(pwd)"
echo "Home directory: $HOME"
echo ""

# Step 2: Find app directory
echo "[2/8] Finding app directory..."
if [ -d "$APP_DIR" ]; then
    echo "✅ Found: $APP_DIR"
    cd $APP_DIR
elif [ -d "/var/www/cryptorafts" ]; then
    echo "✅ Found: /var/www/cryptorafts"
    cd /var/www/cryptorafts
    APP_DIR="/var/www/cryptorafts"
else
    echo "⚠️  App directory not found, creating..."
    mkdir -p $APP_DIR
    cd $APP_DIR
fi

CURRENT_DIR=$(pwd)
echo "✅ Working in: $CURRENT_DIR"
echo ""

# Step 3: Check if src/app exists
echo "[3/8] Checking source files..."
if [ ! -d "src/app" ]; then
    echo "❌ CRITICAL: src/app directory NOT FOUND!"
    echo ""
    echo "Files need to be uploaded first!"
    echo ""
    echo "Upload via FileZilla:"
    echo "  1. Download: https://filezilla-project.org/"
    echo "  2. Connect: sftp://145.79.211.130:65002"
    echo "  3. Username: u386122906"
    echo "  4. Password: Shamsi2627@@"
    echo "  5. Upload ALL files from C:\Users\dell\cryptorafts-starter"
    echo "  6. Upload to: $CURRENT_DIR"
    echo ""
    echo "After uploading, run this script again."
    exit 1
fi

if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ src/app/page.tsx NOT FOUND!"
    echo ""
    echo "Listing src/app/ contents:"
    ls -la src/app/ 2>/dev/null || echo "Directory exists but empty or inaccessible"
    echo ""
    exit 1
fi

echo "✅ src/app/page.tsx exists"
echo "✅ Source files verified"
echo ""

# Step 4: Fix permissions
echo "[4/8] Fixing permissions..."
sudo chown -R $USER:$USER . 2>/dev/null || chown -R $USER:$USER .
sudo chmod -R 755 . 2>/dev/null || chmod -R 755 .
echo "✅ Permissions fixed"
echo ""

# Step 5: Install dependencies
echo "[5/8] Installing dependencies..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json NOT FOUND!"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies (this may take a few minutes)..."
    npm install --production
else
    echo "Updating dependencies..."
    npm install --production
fi
echo "✅ Dependencies installed"
echo ""

# Step 6: Clean and build
echo "[6/8] Cleaning and building application..."
echo "⏱️  This will take 3-5 minutes..."
rm -rf .next
rm -rf out
rm -f build.log

echo "Building with NODE_ENV=production..."
NODE_ENV=production npm run build 2>&1 | tee build.log | tail -50

if [ ! -d ".next" ]; then
    echo "❌ Build failed - .next directory not created"
    echo ""
    echo "Build errors:"
    grep -i error build.log | head -20 || echo "Check build.log for errors"
    exit 1
fi

if [ ! -d ".next/static" ]; then
    echo "❌ Build incomplete - static files not found"
    exit 1
fi

CHUNK_COUNT=$(ls .next/static/chunks/*.js 2>/dev/null | wc -l)
if [ "$CHUNK_COUNT" -eq 0 ]; then
    echo "❌ No JavaScript chunks built!"
    exit 1
fi

echo "✅ Build successful ($CHUNK_COUNT JS files)"
echo ""

# Step 7: Create server.js
echo "[7/8] Setting up server..."
if [ ! -f "server.js" ]; then
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

# Create ecosystem.config.js
if [ ! -f "ecosystem.config.js" ]; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
  }],
};
EOF
    echo "✅ ecosystem.config.js created"
fi

# Create logs directory
mkdir -p logs
echo ""

# Step 8: Start with PM2 and fix Nginx
echo "[8/8] Starting app and configuring Nginx..."

# Install PM2 if needed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2 || npm install -g pm2
fi

# Stop existing app
if pm2 list | grep -q cryptorafts; then
    echo "Stopping existing app..."
    pm2 stop cryptorafts || true
    pm2 delete cryptorafts || true
    sleep 2
fi

# Start app
echo "Starting app with PM2..."
pm2 start ecosystem.config.js || pm2 start server.js --name cryptorafts
pm2 save

echo "Waiting for app to start..."
sleep 5

# Verify app is responding
for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ App responding on port 3000"
        break
    else
        echo "⚠️  App not responding yet (attempt $i/10)..."
        sleep 3
    fi
done

# Fix Nginx configuration
echo "Configuring Nginx..."
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

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/

# Test and reload Nginx
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
else
    echo "⚠️  Nginx config test failed"
    sudo nginx -t
fi

echo ""

# Final verification
echo "======================================================"
echo "  FIX COMPLETE!"
echo "======================================================"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "App Response:"
curl -I http://localhost:3000 2>/dev/null | head -3 || echo "App starting..."
echo ""
echo "✅ Your website should be LIVE at:"
echo "   https://www.cryptorafts.com"
echo ""
echo "Next Steps:"
echo "   1. Wait 30 seconds"
echo "   2. Clear browser cache: Ctrl+Shift+Delete"
echo "   3. Hard refresh: Ctrl+F5"
echo "   4. Visit: https://www.cryptorafts.com"
echo ""
echo "If still seeing errors:"
echo "   pm2 logs cryptorafts"
echo "   curl http://localhost:3000"
echo ""

