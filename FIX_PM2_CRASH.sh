#!/bin/bash
# ============================================
# FIX PM2 CRASH - Install missing dependencies
# ============================================

cd /var/www/cryptorafts

echo "🔧 FIXING PM2 CRASH - Installing missing dependencies"
echo "===================================================="
echo ""

# Step 1: Stop PM2
echo "📋 Step 1: Stopping PM2..."
pm2 stop cryptorafts 2>/dev/null || true
pm2 delete cryptorafts 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 2: Install missing dependencies
echo "📋 Step 2: Installing missing dependencies..."
npm install dotenv --legacy-peer-deps || {
    echo "⚠️  dotenv install failed, checking if it's already in package.json..."
}

# Verify all required dependencies
echo "📋 Step 3: Verifying required dependencies..."
REQUIRED_DEPS=("next" "dotenv")
MISSING_DEPS=()

for dep in "${REQUIRED_DEPS[@]}"; do
    if [ ! -d "node_modules/$dep" ]; then
        echo "⚠️  Missing: $dep"
        MISSING_DEPS+=("$dep")
    else
        echo "✅ Found: $dep"
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "📦 Installing missing dependencies: ${MISSING_DEPS[*]}"
    npm install "${MISSING_DEPS[@]}" --legacy-peer-deps || {
        echo "❌ Failed to install missing dependencies"
        exit 1
    }
fi
echo "✅ All dependencies verified"
echo ""

# Step 3: Verify server.js exists and is correct
echo "📋 Step 4: Verifying server.js..."
if [ ! -f "server.js" ]; then
    echo "⚠️  server.js not found, creating it..."
    cat > server.js << 'SERVEREOF'
require('dotenv').config({ path: '.env.local' });
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

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
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
SERVEREOF
    echo "✅ server.js created"
else
    echo "✅ server.js exists"
fi
echo ""

# Step 4: Update ecosystem.config.js with correct Node path
echo "📋 Step 5: Updating ecosystem.config.js..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
nvm use 20 2>/dev/null || true
NODE_PATH=$(nvm which 20 2>/dev/null || which node)
echo "Using Node.js path: $NODE_PATH"

cat > ecosystem.config.js << PM2EOF
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    interpreter: '$NODE_PATH',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_APP_URL: 'https://www.cryptorafts.com',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyBcuVT24UBPUB_U78FGQ04D2BqH6N-4M4E',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'cryptorafts-b9067.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'cryptorafts-b9067',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'cryptorafts-b9067.firebasestorage.app',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '374711838796',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:374711838796:web:3bee725bfa7d8790456ce9',
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
  }],
};
PM2EOF
echo "✅ ecosystem.config.js updated"
echo ""

# Step 5: Verify .next directory exists
echo "📋 Step 6: Verifying build..."
if [ ! -d ".next" ]; then
    echo "⚠️  Build directory not found, rebuilding..."
    npm run build || {
        echo "❌ Build failed"
        exit 1
    }
else
    echo "✅ Build directory exists"
fi
echo ""

# Step 6: Start PM2
echo "📋 Step 7: Starting PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
sleep 10
echo "✅ PM2 started"
echo ""

# Step 7: Check PM2 status
echo "📋 Step 8: Checking PM2 status..."
pm2 status
echo ""

# Step 8: Check logs
echo "📋 Step 9: Checking PM2 logs..."
pm2 logs cryptorafts --lines 10 --nostream || echo "⚠️  Logs not available yet"
echo ""

# Step 9: Test local server
echo "📋 Step 10: Testing local server..."
sleep 5
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ Server responding (HTTP $HTTP_CODE)"
else
    echo "⚠️  Server not responding (HTTP $HTTP_CODE)"
    echo "Checking PM2 logs..."
    pm2 logs cryptorafts --lines 20 --nostream
fi
echo ""

echo "✅ PM2 CRASH FIX COMPLETE!"
echo "===================================================="
echo ""
echo "If server is still not responding, check logs with:"
echo "  pm2 logs cryptorafts --lines 50"
echo ""

