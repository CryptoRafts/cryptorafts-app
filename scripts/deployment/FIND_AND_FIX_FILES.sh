#!/bin/bash
# ============================================
# FIND AND FIX FILES
# ============================================

set -e

echo "🔍 FINDING FILES"
echo "================"
echo ""

# Check current directory
echo "📁 Current directory: $(pwd)"
echo ""

# Search for package.json in common locations
echo "🔍 Searching for package.json..."
echo ""

# Check /var/www/cryptorafts
if [ -f "/var/www/cryptorafts/package.json" ]; then
    echo "✅ Found in /var/www/cryptorafts"
    cd /var/www/cryptorafts
elif [ -f "$HOME/cryptorafts/package.json" ]; then
    echo "✅ Found in $HOME/cryptorafts"
    cd "$HOME/cryptorafts"
elif [ -f "./package.json" ]; then
    echo "✅ Found in current directory"
else
    echo "🔍 Searching in common locations..."
    find /var/www -name "package.json" -type f 2>/dev/null | head -5
    find /home -name "package.json" -type f 2>/dev/null | head -5
    find ~ -name "package.json" -type f 2>/dev/null | head -5
    echo ""
    
    # Check if files are in subdirectories
    if [ -d "/var/www/cryptorafts/DEPLOY_TO_VPS" ]; then
        echo "⚠️  Found DEPLOY_TO_VPS directory!"
        cd /var/www/cryptorafts
        if [ -f "DEPLOY_TO_VPS/package.json" ]; then
            echo "✅ Found package.json in DEPLOY_TO_VPS"
            echo "Moving files from DEPLOY_TO_VPS..."
            mv DEPLOY_TO_VPS/* . 2>/dev/null || true
            mv DEPLOY_TO_VPS/.* . 2>/dev/null || true
            rmdir DEPLOY_TO_VPS 2>/dev/null || true
            echo "✅ Files moved!"
        fi
    fi
    
    if [ ! -f "package.json" ]; then
        echo ""
        echo "❌ ERROR: package.json NOT FOUND!"
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
fi

# Verify files exist
echo ""
echo "📋 Verifying files..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json still not found!"
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
echo "Current directory: $(pwd)"
echo "Files:"
ls -la package.json src/app/page.tsx next.config.js 2>/dev/null | head -5
echo ""

# If we're not in /var/www/cryptorafts, move files there
if [ "$(pwd)" != "/var/www/cryptorafts" ]; then
    echo "⚠️  Files are not in /var/www/cryptorafts"
    echo "Current location: $(pwd)"
    echo ""
    echo "Do you want to move files to /var/www/cryptorafts? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        echo "Moving files to /var/www/cryptorafts..."
        mkdir -p /var/www/cryptorafts
        cp -r ./* /var/www/cryptorafts/ 2>/dev/null || true
        cp -r ./.* /var/www/cryptorafts/ 2>/dev/null || true
        cd /var/www/cryptorafts
        echo "✅ Files moved to /var/www/cryptorafts"
    fi
fi

# Now run deployment
echo ""
echo "🚀 STARTING DEPLOYMENT"
echo "====================="
echo ""

# Load NVM and use Node.js 20
echo "📦 Loading NVM and using Node.js 20..."
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

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Clean and install dependencies
echo "🧹 Cleaning old files..."
rm -rf node_modules package-lock.json .next out
echo "✅ Cleaned"
echo ""

echo "📦 Installing dependencies (5-10 minutes)..."
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

# Build application
echo "🔨 Building application..."
NODE_ENV=production npm run build || {
    echo "❌ ERROR: Build failed!"
    exit 1
}
echo "✅ Build completed!"
echo ""

# Create server.js
echo "📝 Creating server.js..."
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
echo "📝 Creating ecosystem.config.js..."
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
echo "🚀 Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
echo "✅ PM2 started"
echo ""

# Show status
echo "📊 PM2 Status..."
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

