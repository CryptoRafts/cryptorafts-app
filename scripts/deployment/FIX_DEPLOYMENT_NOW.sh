#!/bin/bash
# ============================================
# FIX DEPLOYMENT - Check files and deploy
# ============================================

set -e

echo "🚀 FIXING DEPLOYMENT"
echo "===================="
echo ""

# Step 1: Navigate to app directory
echo "📁 Step 1: Navigating to app directory..."
cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    echo "Creating directory..."
    mkdir -p /var/www/cryptorafts
    cd /var/www/cryptorafts
}

# Step 2: Check if files exist
echo ""
echo "🔍 Step 2: Checking for files..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo ""
    echo "📋 UPLOAD FILES VIA HOSTINGER FILE MANAGER:"
    echo "   1. Go to: https://hpanel.hostinger.com/"
    echo "   2. Click 'File Manager'"
    echo "   3. Navigate to: /var/www/cryptorafts"
    echo "      (Type /var/www/cryptorafts in PATH BAR at top)"
    echo "   4. Upload ALL files from DEPLOY_TO_VPS folder:"
    echo "      - src/ folder (entire folder)"
    echo "      - package.json"
    echo "      - next.config.js"
    echo "      - tsconfig.json"
    echo "      - public/ folder (if exists)"
    echo ""
    echo "   5. Wait for upload to complete"
    echo ""
    echo "   6. Then run this script again:"
    echo "      cd /var/www/cryptorafts && bash FIX_DEPLOYMENT_NOW.sh"
    echo ""
    exit 1
fi

if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ ERROR: src/app/page.tsx not found!"
    echo ""
    echo "📋 Upload src/ folder via Hostinger File Manager!"
    echo ""
    exit 1
fi

echo "✅ Files found!"
ls -la package.json
ls -la src/app/page.tsx

# Step 3: Install NVM and Node.js 20
echo ""
echo "📦 Step 3: Installing NVM and Node.js 20..."
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

# Step 4: Install dependencies
echo ""
echo "📦 Step 4: Installing dependencies..."
npm install --legacy-peer-deps || {
    echo "❌ npm install failed!"
    exit 1
}

echo "✅ Dependencies installed!"

# Step 5: Build the app
echo ""
echo "🏗️  Step 5: Building app..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

echo "✅ Build completed!"

# Step 6: Create server.js
echo ""
echo "📝 Step 6: Creating server.js..."
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

# Step 7: Create ecosystem.config.js
echo ""
echo "📝 Step 7: Creating ecosystem.config.js..."
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

# Step 8: Stop old PM2 processes
echo ""
echo "🔄 Step 8: Stopping old PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

# Step 9: Start PM2
echo ""
echo "🚀 Step 9: Starting PM2..."
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

# Step 10: Verify
echo ""
echo "✅ Step 10: Verifying deployment..."
sleep 5

pm2 logs cryptorafts --lines 20 --nostream

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"
echo "═══════════════════════════════════════════════════════"

