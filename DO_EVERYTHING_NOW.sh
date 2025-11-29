#!/bin/bash
# ============================================
# DO EVERYTHING NOW - COMPLETE AUTOMATION
# ============================================
# Copy and paste this ENTIRE script into your SSH terminal
# This will install Node.js, upload files verification, and deploy everything

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🚀 DO EVERYTHING NOW - COMPLETE AUTOMATION 🚀           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

APP_DIR="$HOME/cryptorafts"

# Step 1: Install Node.js using NVM (no sudo needed)
echo "[1/7] Installing Node.js using NVM..."
echo ""

if [ ! -d "$HOME/.nvm" ]; then
    echo "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 18
echo "Installing Node.js 18..."
nvm install 18
nvm use 18
nvm alias default 18

echo "✅ Node.js installed!"
node --version
npm --version
echo ""

# Step 2: Create directory
echo "[2/7] Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR
pwd
echo "✅ Directory created: $APP_DIR"
echo ""

# Step 3: Check if files exist
echo "[3/7] Checking if files are uploaded..."
if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ CRITICAL: Files NOT uploaded yet!"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  FILES NOT UPLOADED YET!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "You MUST upload files via Hostinger File Manager FIRST!"
    echo ""
    echo "Steps to upload:"
    echo "  1. In Hostinger File Manager, navigate to: /home/u386122906/"
    echo "  2. Click 'New folder' → Type: cryptorafts → Press Enter"
    echo "  3. Double-click 'cryptorafts' to enter it"
    echo "  4. Click 'Upload' button → Select files from:"
    echo "     C:\Users\dell\cryptorafts-starter"
    echo "  5. Upload:"
    echo "     - Entire 'src/' folder (MOST IMPORTANT!)"
    echo "     - package.json"
    echo "     - next.config.js"
    echo "     - All other files"
    echo "  6. Verify: /home/u386122906/cryptorafts/src/app/page.tsx exists"
    echo ""
    echo "After uploading, run this script again:"
    echo "  bash DO_EVERYTHING_NOW.sh"
    echo ""
    exit 1
fi

echo "✅ Files found!"
ls -la src/app/page.tsx
echo ""

# Step 4: Install dependencies
echo "[4/7] Installing dependencies..."
echo "⏱️  This will take 2-3 minutes..."
npm install --production
echo "✅ Dependencies installed"
echo ""

# Step 5: Build application
echo "[5/7] Building application..."
echo "⏱️  This will take 3-5 minutes..."
rm -rf .next out
NODE_ENV=production npm run build

if [ ! -d ".next" ]; then
    echo "❌ Build failed!"
    echo "Build errors:"
    cat build.log 2>/dev/null || echo "Check build output above"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 6: Create server.js
echo "[6/7] Creating server and starting PM2..."
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
pm2 startup

echo "✅ App started with PM2"
echo ""

# Step 7: Final status
echo "[7/7] Final verification..."
sleep 5

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT COMPLETE! ✅                               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "PM2 Status:"
pm2 status
echo ""

echo "App logs (last 20 lines):"
pm2 logs cryptorafts --lines 20 --nostream
echo ""

echo "App Response:"
curl -I http://localhost:3000 2>/dev/null | head -3 || echo "App starting..."
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
echo "If you see errors:"
echo "   pm2 logs cryptorafts"
echo "   pm2 restart cryptorafts"
echo ""

