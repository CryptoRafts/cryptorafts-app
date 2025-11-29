#!/bin/bash
# ============================================
# COMPLETE DEPLOYMENT SCRIPT
# Run this AFTER files are uploaded
# ============================================

set -e

echo "🚀 CRYPTORAFTS DEPLOYMENT"
echo "=========================="
echo ""

# Step 1: Navigate to app directory
echo "📁 Step 1: Navigating to app directory..."
cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    exit 1
}
echo "✅ Current directory: $(pwd)"
echo ""

# Step 2: Verify files exist
echo "🔍 Step 2: Verifying files exist..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 YOU MUST UPLOAD FILES FIRST!"
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
    echo "   - public/ folder"
    echo "5. Then run this script again!"
    echo ""
    exit 1
fi

if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ ERROR: src/app/page.tsx not found!"
    echo "   Upload src/ folder!"
    exit 1
fi

if [ ! -f "next.config.js" ]; then
    echo "❌ ERROR: next.config.js not found!"
    echo "   Upload next.config.js!"
    exit 1
fi

echo "✅ Files verified!"
echo ""

# Step 3: Load NVM and use Node.js 20
echo "📦 Step 3: Loading NVM and using Node.js 20..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 || {
    echo "❌ ERROR: Node.js 20 not found! Installing..."
    nvm install 20
    nvm use 20
}
NODE_PATH=$(which node)
echo "✅ Using Node.js: $NODE_PATH ($(node --version))"
echo ""

# Step 4: Stop PM2
echo "🛑 Step 4: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 5: Clean and install dependencies
echo "🧹 Step 5: Cleaning old files..."
rm -rf node_modules package-lock.json .next out
echo "✅ Cleaned"
echo ""

echo "📦 Step 6: Installing dependencies (this will take 5-10 minutes)..."
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

# Step 7: Build application
echo "🔨 Step 7: Building application..."
NODE_ENV=production npm run build || {
    echo "❌ ERROR: Build failed!"
    exit 1
}
echo "✅ Build completed!"
echo ""

# Step 8: Create server.js
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

# Step 9: Create ecosystem.config.js
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

# Step 10: Start PM2
echo "🚀 Step 10: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
echo "✅ PM2 started"
echo ""

# Step 11: Show status
echo "📊 Step 11: PM2 Status..."
pm2 status
echo ""

# Step 12: Wait and show logs
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
echo "📋 Useful commands:"
echo "   pm2 status              - Check application status"
echo "   pm2 logs cryptorafts    - View application logs"
echo "   pm2 restart cryptorafts - Restart application"
echo ""

