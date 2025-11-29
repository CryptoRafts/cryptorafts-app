#!/bin/bash
# ============================================
# RUN THIS AFTER UPLOADING FILES VIA FILEZILLA
# ============================================
# Copy and paste this ENTIRE script into your SSH terminal

set -e

echo ""
echo "======================================================"
echo "  INSTALLING NODE.JS AND DEPLOYING"
echo "======================================================"
echo ""

# Install NVM (Node Version Manager - no sudo needed)
echo "[1/6] Installing Node.js using NVM..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

echo "✅ Node.js installed!"
node --version
npm --version
echo ""

# Navigate to directory
echo "[2/6] Navigating to app directory..."
mkdir -p ~/cryptorafts
cd ~/cryptorafts
pwd
echo ""

# Check if files exist
echo "[3/6] Checking if files exist..."
if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ Files NOT uploaded yet!"
    echo ""
    echo "Please upload files via FileZilla first!"
    echo "See: FILEZILLA_UPLOAD_STEPS.md"
    exit 1
fi
echo "✅ Files found!"
echo ""

# Install dependencies
echo "[4/6] Installing dependencies..."
echo "⏱️  This will take 2-3 minutes..."
npm install --production
echo "✅ Dependencies installed"
echo ""

# Build
echo "[5/6] Building application..."
echo "⏱️  This will take 3-5 minutes..."
rm -rf .next out
NODE_ENV=production npm run build
echo "✅ Build complete"
echo ""

# Create server.js
echo "[6/6] Creating server and starting PM2..."
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

# Install PM2
npm install -g pm2

# Start with PM2
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
pm2 start server.js --name cryptorafts
pm2 save

echo ""
echo "======================================================"
echo "  DEPLOYMENT COMPLETE!"
echo "======================================================"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "✅ Your website should be LIVE at:"
echo "   https://www.cryptorafts.com"
echo ""
echo "Next Steps:"
echo "   1. Wait 30 seconds"
echo "   2. Clear browser cache: Ctrl+Shift+Delete"
echo "   3. Hard refresh: Ctrl+F5"
echo "   4. Visit: https://www.cryptorafts.com"
echo ""

