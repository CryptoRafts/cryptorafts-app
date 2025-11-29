#!/bin/bash
# Fix corrupted tar.gz and complete deployment

echo "🔧 FIXING CORRUPTED TAR.GZ ISSUE..."

cd /var/www/cryptorafts

# Step 1: Check if files exist
echo "📋 Step 1: Checking if files exist..."
if [ -f "package.json" ] && [ -f "src/app/page.tsx" ]; then
    echo "✅ Files already exist!"
else
    echo "❌ Files missing! The tar.gz extraction failed."
    echo ""
    echo "📋 SOLUTION: Upload files directly via Hostinger File Manager"
    echo "   1. Go to: https://hpanel.hostinger.com/"
    echo "   2. File Manager"
    echo "   3. Navigate to: /var/www/cryptorafts"
    echo "   4. Upload ALL files from your local DEPLOY_TO_VPS folder:"
    echo "      - src/ folder (entire folder)"
    echo "      - package.json"
    echo "      - next.config.js"
    echo "      - tsconfig.json"
    echo "      - public/ folder (if exists)"
    echo "   5. Wait for upload to complete"
    echo ""
    echo "After uploading, run this command again to continue deployment."
    exit 1
fi

# Step 2: Load Node.js 20
echo ""
echo "📦 Step 2: Loading Node.js 20..."
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    if ! nvm use 20 2>/dev/null; then
        nvm install 20
        nvm use 20
    fi
else
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
fi
node --version

# Step 3: Install dependencies
echo ""
echo "📦 Step 3: Installing dependencies..."
npm install --legacy-peer-deps || {
    echo "❌ npm install failed!"
    exit 1
}

# Step 4: Build app
echo ""
echo "🏗️  Step 4: Building app..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

# Step 5: Verify build
echo ""
echo "✅ Step 5: Verifying build..."
ls -la .next || {
    echo "❌ Build output missing!"
    exit 1
}

# Step 6: Create server.js
echo ""
echo "📝 Step 6: Creating server.js..."
cat > server.js << 'EOF'
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
EOF

# Step 7: Create ecosystem.config.js
echo ""
echo "📝 Step 7: Creating ecosystem.config.js..."
NODE_PATH=$(which node)
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

# Step 8: Stop old PM2 processes
echo ""
echo "🔄 Step 8: Stopping old PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Step 9: Start PM2
echo ""
echo "🚀 Step 9: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 status

# Step 10: Verify
echo ""
echo "✅ Step 10: Verifying app is running..."
sleep 5
pm2 logs cryptorafts --lines 20 --nostream

echo ""
echo "🧪 Step 11: Testing app..."
curl -s http://localhost:3000 | head -n 5 || echo "❌ App not responding!"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"

