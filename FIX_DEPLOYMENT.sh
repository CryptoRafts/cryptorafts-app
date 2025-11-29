#!/bin/bash
# ============================================
# FIX DEPLOYMENT - Check and Fix Everything
# ============================================

set -e

echo "🔍 FIXING DEPLOYMENT"
echo "===================="
echo ""

# Step 1: Navigate and check directory
echo "📁 Step 1: Checking directory..."
cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    exit 1
}

echo "Current directory: $(pwd)"
echo ""

# Step 2: List all files
echo "📋 Step 2: Listing all files in directory..."
ls -la
echo ""

# Step 3: Check for package.json in various locations
echo "🔍 Step 3: Checking for package.json..."
if [ -f "package.json" ]; then
    echo "✅ package.json found in /var/www/cryptorafts"
elif [ -f "./package.json" ]; then
    echo "✅ package.json found in ./"
else
    echo "❌ package.json NOT FOUND!"
    echo ""
    echo "Checking subdirectories..."
    find . -name "package.json" -type f 2>/dev/null | head -5
    echo ""
    echo "Checking if files are in subdirectory..."
    if [ -d "DEPLOY_TO_VPS" ]; then
        echo "⚠️  Found DEPLOY_TO_VPS directory!"
        echo "Moving files from DEPLOY_TO_VPS..."
        mv DEPLOY_TO_VPS/* . 2>/dev/null || true
        mv DEPLOY_TO_VPS/.* . 2>/dev/null || true
        rmdir DEPLOY_TO_VPS 2>/dev/null || true
    fi
    echo ""
fi

# Step 4: Verify files exist
echo "🔍 Step 4: Verifying files exist..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json still not found!"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 FILES MUST BE UPLOADED VIA HOSTINGER FILE MANAGER!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "1. Go to: https://hpanel.hostinger.com/"
    echo "2. Click 'File Manager'"
    echo "3. Navigate to: /var/www/cryptorafts"
    echo "4. Upload from C:\Users\dell\cryptorafts-starter:"
    echo "   - src/ folder"
    echo "   - package.json"
    echo "   - next.config.js"
    echo "   - tsconfig.json"
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

# Step 5: Load NVM and use Node.js 20
echo "📦 Step 5: Loading NVM and using Node.js 20..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
if ! command -v nvm &> /dev/null; then
    echo "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi

if ! nvm use 20 2>/dev/null; then
    echo "Installing Node.js 20..."
    nvm install 20
    nvm use 20
fi

NODE_PATH=$(which node)
echo "✅ Using Node.js: $NODE_PATH ($(node --version))"
echo ""

# Step 6: Stop PM2
echo "🛑 Step 6: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 7: Clean and install dependencies
echo "🧹 Step 7: Cleaning old files..."
rm -rf node_modules package-lock.json .next out
echo "✅ Cleaned"
echo ""

echo "📦 Step 8: Installing dependencies (5-10 minutes)..."
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

# Step 9: Build application
echo "🔨 Step 9: Building application..."
NODE_ENV=production npm run build || {
    echo "❌ ERROR: Build failed!"
    exit 1
}
echo "✅ Build completed!"
echo ""

# Step 10: Create server.js
echo "📝 Step 10: Creating server.js..."
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

# Step 11: Create ecosystem.config.js
echo "📝 Step 11: Creating ecosystem.config.js..."
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

# Step 12: Start PM2
echo "🚀 Step 12: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
echo "✅ PM2 started"
echo ""

# Step 13: Show status
echo "📊 Step 13: PM2 Status..."
pm2 status
echo ""

# Step 14: Wait and show logs
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

