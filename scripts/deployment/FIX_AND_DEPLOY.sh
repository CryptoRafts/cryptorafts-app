#!/bin/bash
# Fix deployment issues and complete deployment

echo "🔧 FIXING DEPLOYMENT ISSUES..."

cd /var/www/cryptorafts

# Step 1: Extract tar.gz properly
echo "📦 Step 1: Extracting cryptorafts.tar.gz..."
if [ -f "cryptorafts.tar.gz" ]; then
    tar -xzf cryptorafts.tar.gz
    
    # Move files from subdirectories if needed
    if [ -d "cryptorafts" ]; then
        echo "📁 Moving files from cryptorafts/ subdirectory..."
        mv cryptorafts/* . 2>/dev/null || true
        mv cryptorafts/.* . 2>/dev/null || true
        rmdir cryptorafts 2>/dev/null || true
    fi
    
    if [ -d "DEPLOY_TO_VPS" ]; then
        echo "📁 Moving files from DEPLOY_TO_VPS/ subdirectory..."
        mv DEPLOY_TO_VPS/* . 2>/dev/null || true
        mv DEPLOY_TO_VPS/.* . 2>/dev/null || true
        rmdir DEPLOY_TO_VPS 2>/dev/null || true
    fi
fi

# Step 2: Verify files exist
echo ""
echo "✅ Step 2: Verifying files..."
ls -la package.json || {
    echo "❌ package.json still missing! Please upload files via Hostinger File Manager."
    exit 1
}
ls -la src/app/page.tsx || {
    echo "❌ src/app/page.tsx still missing! Please upload files via Hostinger File Manager."
    exit 1
}

# Step 3: Install NVM and Node.js 20
echo ""
echo "📦 Step 3: Installing NVM and Node.js 20..."
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

# Step 4: Install dependencies
echo ""
echo "📦 Step 4: Installing dependencies..."
npm install --legacy-peer-deps || {
    echo "❌ npm install failed!"
    exit 1
}

# Step 5: Build app
echo ""
echo "🏗️  Step 5: Building app..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

# Step 6: Verify build
echo ""
echo "✅ Step 6: Verifying build..."
ls -la .next || {
    echo "❌ Build output missing!"
    exit 1
}

# Step 7: Create server.js
echo ""
echo "📝 Step 7: Creating server.js..."
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

# Step 8: Create ecosystem.config.js with proper Node.js path
echo ""
echo "📝 Step 8: Creating ecosystem.config.js..."
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

# Step 9: Stop old PM2 processes
echo ""
echo "🔄 Step 9: Stopping old PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Step 10: Start PM2
echo ""
echo "🚀 Step 10: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 status

# Step 11: Verify
echo ""
echo "✅ Step 11: Verifying app is running..."
sleep 5
pm2 logs cryptorafts --lines 20 --nostream

echo ""
echo "🧪 Step 12: Testing app..."
curl -s http://localhost:3000 | head -n 5 || echo "❌ App not responding!"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"

