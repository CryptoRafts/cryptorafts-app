#!/bin/bash
# ============================================
# CHECK FILES AND FIX DEPLOYMENT
# ============================================

echo "🔍 CHECKING FILES IN /var/www/cryptorafts"
echo "=========================================="
echo ""

cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts directory not found!"
    echo "Creating directory..."
    mkdir -p /var/www/cryptorafts
    cd /var/www/cryptorafts
}

echo "📁 Current directory: $(pwd)"
echo ""
echo "📋 Checking for required files..."
echo ""

# Check package.json
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    ls -lh package.json
else
    echo "❌ package.json NOT FOUND!"
    echo ""
    echo "📋 UPLOAD package.json via Hostinger File Manager"
    echo "   Location: /var/www/cryptorafts/package.json"
fi

echo ""

# Check src/app/page.tsx
if [ -f "src/app/page.tsx" ]; then
    echo "✅ src/app/page.tsx found"
    ls -lh src/app/page.tsx
else
    echo "❌ src/app/page.tsx NOT FOUND!"
    echo ""
    echo "📋 UPLOAD src/ folder via Hostinger File Manager"
    echo "   Location: /var/www/cryptorafts/src/"
fi

echo ""

# Check next.config.js
if [ -f "next.config.js" ]; then
    echo "✅ next.config.js found"
    ls -lh next.config.js
else
    echo "❌ next.config.js NOT FOUND!"
    echo ""
    echo "📋 UPLOAD next.config.js via Hostinger File Manager"
fi

echo ""

# List all files in directory
echo "📁 Files currently in /var/www/cryptorafts:"
echo "-------------------------------------------"
ls -la
echo ""

# Check if files are missing
if [ ! -f "package.json" ] || [ ! -f "src/app/page.tsx" ]; then
    echo "❌ REQUIRED FILES MISSING!"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 UPLOAD FILES VIA HOSTINGER FILE MANAGER"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "STEP 1: Go to Hostinger File Manager"
    echo "   1. Visit: https://hpanel.hostinger.com/"
    echo "   2. Click 'File Manager'"
    echo "   3. In the PATH BAR at the top, type: /var/www/cryptorafts"
    echo "   4. Press Enter"
    echo ""
    echo "STEP 2: Upload ALL files from DEPLOY_TO_VPS folder"
    echo "   Upload these files/folders:"
    echo "   - src/ folder (entire folder)"
    echo "   - package.json"
    echo "   - next.config.js"
    echo "   - tsconfig.json"
    echo "   - public/ folder (if exists)"
    echo ""
    echo "STEP 3: Verify files uploaded"
    echo "   After uploading, run this command again:"
    echo "   cd /var/www/cryptorafts && bash CHECK_FILES_AND_FIX.sh"
    echo ""
    echo "STEP 4: Run deployment after files are uploaded"
    echo "   cd /var/www/cryptorafts && bash DEPLOY_AFTER_UPLOAD.sh"
    echo ""
    exit 1
fi

echo "✅ ALL FILES FOUND! Ready for deployment!"
echo ""
echo "📋 Running deployment..."
echo ""

# Run deployment
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
else
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi

nvm install 20
nvm use 20

npm install --legacy-peer-deps

rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build

# Create server.js
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

mkdir -p logs
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 status

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"

