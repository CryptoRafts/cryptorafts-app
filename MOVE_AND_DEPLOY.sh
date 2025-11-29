#!/bin/bash
# ============================================
# MOVE FILES AND DEPLOY - COMPLETE AUTOMATION
# ============================================

set -e

echo "🚀 COMPLETE AUTOMATED DEPLOYMENT"
echo "=================================="
echo ""

# Step 1: Navigate to app directory
echo "📁 Step 1: Navigating to app directory..."
cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    exit 1
}

# Step 2: Move files from DEPLOY_TO_VPS to current directory
echo ""
echo "📦 Step 2: Moving files from DEPLOY_TO_VPS..."
if [ -d "DEPLOY_TO_VPS" ]; then
    echo "Found DEPLOY_TO_VPS folder. Moving files..."
    
    # Move all files and folders from DEPLOY_TO_VPS to current directory
    mv DEPLOY_TO_VPS/* . 2>/dev/null || true
    mv DEPLOY_TO_VPS/.* . 2>/dev/null || true
    
    # Remove DEPLOY_TO_VPS folder if empty
    rmdir DEPLOY_TO_VPS 2>/dev/null || true
    
    echo "✅ Files moved!"
else
    echo "⚠️  DEPLOY_TO_VPS folder not found. Checking for files directly..."
fi

# Step 3: Verify critical files exist
echo ""
echo "🔍 Step 3: Verifying critical files..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo ""
    echo "Files in current directory:"
    ls -la
    echo ""
    echo "Please ensure files are uploaded to /var/www/cryptorafts"
    exit 1
fi

if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ ERROR: src/app/page.tsx not found!"
    echo ""
    echo "Files in current directory:"
    ls -la
    echo ""
    echo "Please ensure src/ folder is uploaded to /var/www/cryptorafts"
    exit 1
fi

echo "✅ All critical files found!"
ls -lh package.json
ls -lh src/app/page.tsx
ls -lh next.config.js 2>/dev/null || echo "⚠️  next.config.js not found (may be OK)"

# Step 4: Install NVM and Node.js 20
echo ""
echo "📦 Step 4: Installing NVM and Node.js 20..."
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    if ! nvm use 20 2>/dev/null; then
        echo "Installing Node.js 20..."
        nvm install 20
        nvm use 20
    fi
else
    echo "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
fi

echo "✅ Node.js $(node --version) is active"
npm --version

# Step 5: Install dependencies
echo ""
echo "📦 Step 5: Installing dependencies (this may take 5-10 minutes)..."
npm install --legacy-peer-deps || {
    echo "❌ npm install failed!"
    exit 1
}

echo "✅ Dependencies installed!"

# Step 6: Build the app
echo ""
echo "🏗️  Step 6: Building app (this may take 5-10 minutes)..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

echo "✅ Build completed!"

# Step 7: Verify build
echo ""
echo "✅ Step 7: Verifying build..."
if [ ! -d ".next" ]; then
    echo "❌ Build output (.next directory) missing!"
    exit 1
fi
echo "✅ Build verified!"

# Step 8: Create server.js
echo ""
echo "📝 Step 8: Creating server.js..."
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
echo "📝 Step 9: Creating ecosystem.config.js..."
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "❌ ERROR: Node.js not found in PATH!"
    exit 1
fi

echo "Node.js path: $NODE_PATH"

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

echo "✅ ecosystem.config.js created!"

# Step 10: Stop old PM2 processes
echo ""
echo "🔄 Step 10: Stopping old PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

# Step 11: Start PM2
echo ""
echo "🚀 Step 11: Starting PM2..."
mkdir -p logs

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

pm2 start ecosystem.config.js || {
    echo "❌ PM2 start failed!"
    pm2 logs cryptorafts --lines 20 --nostream
    exit 1
}

pm2 save
pm2 status

echo "✅ PM2 started!"

# Step 12: Verify deployment
echo ""
echo "✅ Step 12: Verifying deployment..."
sleep 5

# Check PM2 status
pm2 status | grep -q "online" || {
    echo "❌ App not online!"
    pm2 logs cryptorafts --lines 20 --nostream
    exit 1
}

# Check logs for errors
LOG_ERRORS=$(pm2 logs cryptorafts --lines 30 --nostream 2>&1 | grep -i "error\|cannot find module" || true)
if [ -n "$LOG_ERRORS" ]; then
    echo "⚠️  WARNING: Errors found in logs:"
    echo "$LOG_ERRORS"
    echo ""
    echo "Full logs:"
    pm2 logs cryptorafts --lines 30 --nostream
else
    echo "✅ No errors in logs!"
fi

# Test app
echo ""
echo "🧪 Step 13: Testing app..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ App is responding! (HTTP $HTTP_CODE)"
    RESPONSE=$(curl -s http://localhost:3000 2>/dev/null | head -n 5 || echo "")
    if [ -n "$RESPONSE" ]; then
        echo "Response preview: $(echo $RESPONSE | head -c 100)..."
    fi
elif [ "$HTTP_CODE" = "000" ]; then
    echo "⚠️  App may still be starting (HTTP connection failed)"
else
    echo "⚠️  HTTP Code: $HTTP_CODE"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 PM2 Status:"
pm2 status
echo ""
echo "📋 Recent Logs:"
pm2 logs cryptorafts --lines 10 --nostream

