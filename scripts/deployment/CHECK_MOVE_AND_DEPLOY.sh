#!/bin/bash
# ============================================
# CHECK FILES, MOVE, AND DEPLOY
# ============================================

set -e

echo "🔍 CHECKING FILES AND DEPLOYING"
echo "================================="
echo ""

cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    exit 1
}

# Step 1: Check if files are in DEPLOY_TO_VPS
echo "📋 Step 1: Checking for files..."
echo ""

if [ -d "DEPLOY_TO_VPS" ]; then
    echo "✅ Found DEPLOY_TO_VPS folder"
    echo "Files in DEPLOY_TO_VPS:"
    ls -la DEPLOY_TO_VPS/ | head -10
    
    if [ -f "DEPLOY_TO_VPS/package.json" ]; then
        echo ""
        echo "✅ Found package.json in DEPLOY_TO_VPS"
        echo "Moving files from DEPLOY_TO_VPS..."
        
        # Move all files and folders
        mv DEPLOY_TO_VPS/* . 2>/dev/null || true
        mv DEPLOY_TO_VPS/.* . 2>/dev/null || true
        
        # Remove empty DEPLOY_TO_VPS folder
        rmdir DEPLOY_TO_VPS 2>/dev/null || rm -rf DEPLOY_TO_VPS 2>/dev/null || true
        
        echo "✅ Files moved!"
    else
        echo "❌ package.json not found in DEPLOY_TO_VPS!"
        exit 1
    fi
else
    echo "⚠️  DEPLOY_TO_VPS folder not found"
fi

# Step 2: Verify files are now in current directory
echo ""
echo "📋 Step 2: Verifying files in current directory..."
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json still not found!"
    echo ""
    echo "Files in current directory:"
    ls -la
    echo ""
    echo "Please ensure files are uploaded to /var/www/cryptorafts"
    exit 1
fi

echo "✅ package.json found!"
ls -lh package.json

if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ ERROR: src/app/page.tsx not found!"
    exit 1
fi

echo "✅ src/app/page.tsx found!"
ls -lh src/app/page.tsx

# Step 3: Load NVM and use Node.js 20
echo ""
echo "📦 Step 3: Loading NVM and Node.js 20..."
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

# Step 4: Stop PM2
echo ""
echo "🔄 Step 4: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

# Step 5: Remove node_modules and reinstall
echo ""
echo "📦 Step 5: Removing old node_modules..."
rm -rf node_modules package-lock.json
echo "✅ Removed!"

echo ""
echo "📦 Step 6: Installing dependencies (5-10 minutes)..."
npm install --legacy-peer-deps || {
    echo "❌ npm install failed!"
    exit 1
}

echo "✅ Dependencies installed!"
ls -la node_modules/next 2>/dev/null && echo "✅ Next.js installed!" || echo "⚠️  Next.js not found!"

# Step 6: Clean and build
echo ""
echo "🏗️  Step 7: Building app (5-10 minutes)..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

echo "✅ Build completed!"
ls -la .next && echo "✅ Build output exists!"

# Step 7: Create server.js
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

# Step 8: Create ecosystem.config.js
echo ""
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
echo "🚀 Step 10: Starting PM2..."
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
echo "✅ Step 11: Verifying deployment..."
sleep 10

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

