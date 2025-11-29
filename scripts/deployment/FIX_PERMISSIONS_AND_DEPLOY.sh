#!/bin/bash
# ============================================
# FIX PERMISSIONS AND DEPLOY
# ============================================

set -e

echo "🔧 FIXING PERMISSIONS AND DEPLOYING"
echo "===================================="
echo ""

# Navigate to directory
cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    exit 1
}

echo "Current directory: $(pwd)"
echo ""

# Fix permissions - make directory and files readable
echo "🔧 Step 1: Fixing permissions..."
chmod 755 /var/www/cryptorafts
chmod 644 /var/www/cryptorafts/*.json /var/www/cryptorafts/*.js /var/www/cryptorafts/*.sh /var/www/cryptorafts/*.txt 2>/dev/null || true
chmod 755 /var/www/cryptorafts/src /var/www/cryptorafts/public 2>/dev/null || true
find /var/www/cryptorafts/src -type f -exec chmod 644 {} \; 2>/dev/null || true
find /var/www/cryptorafts/src -type d -exec chmod 755 {} \; 2>/dev/null || true
echo "✅ Permissions fixed"
echo ""

# List files to verify
echo "📋 Step 2: Verifying files..."
ls -la package.json src/app/page.tsx next.config.js 2>/dev/null || {
    echo "❌ ERROR: Files still not accessible!"
    echo ""
    echo "Checking file ownership..."
    ls -la /var/www/cryptorafts/ | head -20
    echo ""
    echo "Checking for files with different permissions..."
    find /var/www/cryptorafts -name "package.json" -ls 2>/dev/null
    echo ""
    exit 1
}

echo "✅ Files verified!"
echo ""

# Load NVM and use Node.js 20
echo "📦 Step 3: Loading NVM and using Node.js 20..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
if ! nvm use 20 2>/dev/null; then
    nvm install 20
    nvm use 20
fi

NODE_PATH=$(which node)
echo "✅ Using Node.js: $NODE_PATH ($(node --version))"
echo ""

# Stop PM2
echo "🛑 Step 4: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Clean
echo "🧹 Step 5: Cleaning..."
rm -rf node_modules package-lock.json .next out
echo "✅ Cleaned"
echo ""

# Install dependencies
echo "📦 Step 6: Installing dependencies (5-10 minutes)..."
npm install --legacy-peer-deps || {
    echo "❌ ERROR: npm install failed!"
    exit 1
}

if [ ! -f "node_modules/next/package.json" ]; then
    echo "❌ ERROR: next module not installed!"
    exit 1
fi
echo "✅ Dependencies installed!"
echo ""

# Build
echo "🔨 Step 7: Building application..."
NODE_ENV=production npm run build || {
    echo "❌ ERROR: Build failed!"
    exit 1
}
echo "✅ Build completed!"
echo ""

# Create server.js
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
echo "✅ server.js created"
echo ""

# Create ecosystem.config.js
echo "📝 Step 9: Creating ecosystem.config.js..."
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
echo "✅ ecosystem.config.js created"
echo ""

# Start PM2
echo "🚀 Step 10: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
echo "✅ PM2 started"
echo ""

# Show status
echo "📊 Step 11: PM2 Status..."
pm2 status
echo ""

# Wait and show logs
echo "⏳ Waiting 15 seconds for application to start..."
sleep 15
echo ""

echo "📋 Recent logs:"
pm2 logs cryptorafts --lines 30 --nostream
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🌐 Visit: https://www.cryptorafts.com"
echo ""

