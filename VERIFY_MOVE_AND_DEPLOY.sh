#!/bin/bash
# ============================================
# VERIFY FILES, MOVE, AND DEPLOY
# ============================================

set -e

echo "🔍 VERIFYING AND MOVING FILES"
echo "=============================="
echo ""

cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    exit 1
}

# Step 1: Check current directory contents
echo "📋 Step 1: Checking current directory..."
echo "Current directory: $(pwd)"
echo ""
echo "Files in /var/www/cryptorafts:"
ls -la
echo ""

# Step 2: Check if DEPLOY_TO_VPS exists and has files
echo "📋 Step 2: Checking DEPLOY_TO_VPS folder..."
if [ -d "DEPLOY_TO_VPS" ]; then
    echo "✅ Found DEPLOY_TO_VPS folder"
    echo ""
    echo "Files in DEPLOY_TO_VPS:"
    ls -la DEPLOY_TO_VPS/ | head -15
    echo ""
    
    if [ -f "DEPLOY_TO_VPS/package.json" ]; then
        echo "✅ Found package.json in DEPLOY_TO_VPS"
        echo "Moving files from DEPLOY_TO_VPS to /var/www/cryptorafts..."
        echo ""
        
        # Move files
        mv DEPLOY_TO_VPS/* . 2>/dev/null || true
        mv DEPLOY_TO_VPS/.* . 2>/dev/null || true
        
        # Remove DEPLOY_TO_VPS
        rm -rf DEPLOY_TO_VPS 2>/dev/null || true
        
        echo "✅ Files moved!"
    else
        echo "❌ package.json not found in DEPLOY_TO_VPS!"
        exit 1
    fi
else
    echo "⚠️  DEPLOY_TO_VPS folder not found"
fi

# Step 3: Verify files are now in current directory
echo ""
echo "📋 Step 3: Verifying files in /var/www/cryptorafts..."
echo "Files in current directory:"
ls -la | head -20
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json still not found!"
    echo ""
    echo "Please check if files are uploaded to /var/www/cryptorafts"
    exit 1
fi

echo "✅ package.json found!"
ls -lh package.json

if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ ERROR: src/app/page.tsx not found!"
    echo ""
    echo "Checking if src folder exists..."
    ls -la src/ 2>/dev/null || echo "src/ folder not found!"
    exit 1
fi

echo "✅ src/app/page.tsx found!"
ls -lh src/app/page.tsx

# Step 4: Load NVM and use Node.js 20
echo ""
echo "📦 Step 4: Loading NVM and Node.js 20..."
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    nvm use 20 || nvm install 20 && nvm use 20
else
    echo "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
fi

echo "✅ Node.js $(node --version) active"
NODE_PATH=$(which node)
echo "Node.js path: $NODE_PATH"

# Step 5: Stop PM2
echo ""
echo "🔄 Step 5: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

# Step 6: Remove node_modules and reinstall
echo ""
echo "📦 Step 6: Removing old node_modules..."
rm -rf node_modules package-lock.json
echo "✅ Removed!"

echo ""
echo "📦 Step 7: Installing dependencies (5-10 minutes)..."
echo "⚠️  CRITICAL: This will take 5-10 minutes - DO NOT INTERRUPT!"
echo ""
npm install --legacy-peer-deps || {
    echo "❌ npm install failed!"
    exit 1
}

echo ""
echo "✅ Dependencies installed!"

# Verify next is installed
if [ ! -d "node_modules/next" ]; then
    echo "❌ ERROR: 'next' module not found after npm install!"
    exit 1
fi

echo "✅ Verified: next module installed"
ls -lh node_modules/next/package.json

# Step 7: Build
echo ""
echo "🏗️  Step 8: Building app (5-10 minutes)..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

echo "✅ Build completed!"
ls -la .next && echo "✅ Build output exists!"

# Step 8: Create server.js
echo ""
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
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
EOFSERVER

echo "✅ server.js created!"

# Step 9: Create ecosystem.config.js
echo ""
echo "📝 Step 10: Creating ecosystem.config.js..."
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

echo "✅ ecosystem.config.js created with Node path: $NODE_PATH"

# Step 10: Start PM2
echo ""
echo "🚀 Step 11: Starting PM2..."
mkdir -p logs

pm2 start ecosystem.config.js || {
    echo "❌ PM2 start failed!"
    pm2 logs cryptorafts --lines 30 --nostream
    exit 1
}

pm2 save
pm2 status

echo "✅ PM2 started!"

# Step 11: Verify
echo ""
echo "✅ Step 12: Verifying deployment..."
sleep 15

pm2 status

echo ""
echo "📋 Checking logs..."
pm2 logs cryptorafts --lines 30 --nostream

echo ""
echo "🧪 Testing app..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ App is responding! (HTTP $HTTP_CODE)"
else
    echo "⚠️  HTTP Code: $HTTP_CODE (App may still be starting)"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"
echo "═══════════════════════════════════════════════════════"

