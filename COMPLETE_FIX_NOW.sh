#!/bin/bash
# ============================================
# COMPLETE FIX - Find files and deploy
# ============================================

set -e

echo "🔍 FINDING FILES AND FIXING DEPLOYMENT"
echo "======================================="
echo ""

# Search for package.json
echo "🔍 Searching for package.json..."
FOUND_PATH=$(find /var/www /home -name "package.json" -type f 2>/dev/null | grep -i cryptorafts | head -1)

if [ -z "$FOUND_PATH" ]; then
    echo "❌ ERROR: package.json NOT FOUND!"
    echo ""
    echo "Files must be uploaded via Hostinger File Manager to /var/www/cryptorafts"
    exit 1
fi

# Get directory containing package.json
APP_DIR=$(dirname "$FOUND_PATH")
echo "✅ Found files in: $APP_DIR"
echo ""

# If not in /var/www/cryptorafts, copy files there
if [ "$APP_DIR" != "/var/www/cryptorafts" ]; then
    echo "⚠️  Files are in $APP_DIR, not /var/www/cryptorafts"
    echo "Copying files to /var/www/cryptorafts..."
    mkdir -p /var/www/cryptorafts
    cd "$APP_DIR"
    cp -r src package.json next.config.js tsconfig.json public server.js ecosystem.config.js /var/www/cryptorafts/ 2>/dev/null || true
    echo "✅ Files copied to /var/www/cryptorafts"
fi

# Navigate to deployment directory
cd /var/www/cryptorafts
echo "Current directory: $(pwd)"
echo ""

# Verify files exist
echo "📋 Verifying files..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found in /var/www/cryptorafts!"
    exit 1
fi

if [ ! -d "src/app" ]; then
    echo "❌ ERROR: src/app directory not found!"
    exit 1
fi

echo "✅ Files verified!"
echo ""

# Load NVM and use Node.js 20
echo "📦 Loading NVM and using Node.js 20..."
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
echo "🛑 Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Clean and install dependencies
echo "🧹 Cleaning..."
rm -rf node_modules package-lock.json .next out
echo "✅ Cleaned"
echo ""

echo "📦 Installing dependencies (5-10 minutes)..."
npm install --legacy-peer-deps
echo "✅ Dependencies installed!"
echo ""

# Build
echo "🔨 Building application..."
NODE_ENV=production npm run build
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

# Create ecosystem.config.js
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

# Start PM2
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 status
sleep 15
pm2 logs cryptorafts --lines 30 --nostream

echo ""
echo "✅ DEPLOYMENT COMPLETE! Visit: https://www.cryptorafts.com"

