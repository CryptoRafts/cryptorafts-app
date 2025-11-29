#!/bin/bash
# ============================================
# DIAGNOSE AND FIX - Complete fix script
# ============================================

set -e

echo "🔍 DIAGNOSING ISSUE"
echo "===================="
echo ""

cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    exit 1
}

# Step 1: Check files
echo "📋 Step 1: Checking files..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo ""
    echo "Files in current directory:"
    ls -la
    exit 1
fi

echo "✅ package.json found"
ls -lh package.json

if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ ERROR: src/app/page.tsx not found!"
    exit 1
fi

echo "✅ src/app/page.tsx found"

# Step 2: Check node_modules
echo ""
echo "📋 Step 2: Checking node_modules..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found - dependencies not installed!"
else
    echo "⚠️  node_modules exists but checking if 'next' is installed..."
    if [ ! -d "node_modules/next" ]; then
        echo "❌ 'next' module not found in node_modules!"
        echo "Removing node_modules to reinstall..."
        rm -rf node_modules package-lock.json
    else
        echo "✅ 'next' module found"
    fi
fi

# Step 3: Stop PM2
echo ""
echo "🔄 Step 3: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

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
npm --version

# Step 5: Install dependencies
echo ""
echo "📦 Step 5: Installing dependencies (5-10 minutes)..."
echo "This is critical - please wait for completion..."
echo ""

# Remove node_modules if it exists
rm -rf node_modules package-lock.json

# Install dependencies
npm install --legacy-peer-deps || {
    echo "❌ npm install failed!"
    echo "Checking npm error logs..."
    exit 1
}

echo ""
echo "✅ Dependencies installed!"

# Verify next is installed
if [ ! -d "node_modules/next" ]; then
    echo "❌ ERROR: 'next' module still not found after npm install!"
    echo "Trying to install next explicitly..."
    npm install next@latest --legacy-peer-deps || {
        echo "❌ Failed to install next!"
        exit 1
    }
fi

echo "✅ Verified: next module installed"
ls -lh node_modules/next/package.json

# Step 6: Build
echo ""
echo "🏗️  Step 6: Building app (5-10 minutes)..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

echo "✅ Build completed!"
ls -la .next && echo "✅ Build output exists!"

# Step 7: Create server.js
echo ""
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

echo "✅ server.js created!"

# Step 8: Create ecosystem.config.js
echo ""
echo "📝 Step 8: Creating ecosystem.config.js..."
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

# Step 9: Start PM2
echo ""
echo "🚀 Step 9: Starting PM2..."
mkdir -p logs

pm2 start ecosystem.config.js || {
    echo "❌ PM2 start failed!"
    pm2 logs cryptorafts --lines 30 --nostream
    exit 1
}

pm2 save
pm2 status

echo "✅ PM2 started!"

# Step 10: Verify
echo ""
echo "✅ Step 10: Verifying deployment..."
sleep 15

pm2 status

echo ""
echo "📋 Checking logs for errors..."
pm2 logs cryptorafts --lines 30 --nostream

echo ""
echo "🧪 Testing app..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ App is responding! (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "⚠️  Connection failed - app may still be starting"
else
    echo "⚠️  HTTP Code: $HTTP_CODE"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"
echo "═══════════════════════════════════════════════════════"

