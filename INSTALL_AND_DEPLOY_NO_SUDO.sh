#!/bin/bash
# ============================================
# INSTALL NODE.JS AND DEPLOY - NO SUDO NEEDED
# ============================================
# Run this in your SSH terminal - NO SUDO REQUIRED!

set -e

echo ""
echo "======================================================"
echo "  INSTALLING NODE.JS AND DEPLOYING - NO SUDO"
echo "======================================================"
echo ""

# Step 1: Install Node.js using NVM (no sudo needed)
echo "[1/5] Installing Node.js using NVM (no sudo)..."
echo ""

# Check if NVM is installed
if [ ! -d "$HOME/.nvm" ]; then
    echo "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    echo "✅ NVM installed"
else
    echo "✅ NVM already installed"
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install Node.js 18
echo ""
echo "Installing Node.js 18..."
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
echo ""
echo "Verifying Node.js installation..."
node --version
npm --version

echo "✅ Node.js installed!"
echo ""

# Step 2: Create directory
echo "[2/5] Creating directory..."
mkdir -p ~/cryptorafts
cd ~/cryptorafts
pwd
echo "✅ Directory created"
echo ""

# Step 3: Check if files exist
echo "[3/5] Checking if files exist..."
if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ CRITICAL: Files NOT uploaded yet!"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  FILES NOT UPLOADED YET!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "You MUST upload files FIRST via FileZilla!"
    echo ""
    echo "FileZilla Settings:"
    echo "  1. Download: https://filezilla-project.org/"
    echo "  2. Connect: sftp://145.79.211.130:65002"
    echo "  3. Username: u386122906"
    echo "  4. Password: Shamsi2627@@"
    echo ""
    echo "Upload FROM: C:\Users\dell\cryptorafts-starter"
    echo "Upload TO: /home/u386122906/cryptorafts/"
    echo ""
    echo "IMPORTANT: Upload the ENTIRE src/ folder!"
    echo ""
    echo "After uploading, run this script again:"
    echo "  bash INSTALL_AND_DEPLOY_NO_SUDO.sh"
    echo ""
    exit 1
fi

echo "✅ Files found!"
echo ""

# Step 4: Install dependencies
echo "[4/5] Installing dependencies..."
echo "⏱️  This will take 2-3 minutes..."
npm install --production
echo "✅ Dependencies installed"
echo ""

# Step 5: Build and deploy
echo "[5/5] Building and deploying..."
echo "⏱️  This will take 3-5 minutes..."
echo ""

# Clean old build
rm -rf .next out

# Build
NODE_ENV=production npm run build

# Create server.js
if [ ! -f "server.js" ]; then
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
fi

# Install PM2 globally (in user directory)
echo "Installing PM2..."
npm install -g pm2

# Start with PM2
echo "Starting app with PM2..."
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
pm2 start server.js --name cryptorafts
pm2 save
pm2 startup

echo ""
echo "✅ Build and deployment complete!"
echo ""

# Final status
echo "======================================================"
echo "  DEPLOYMENT COMPLETE!"
echo "======================================================"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "App logs (last 10 lines):"
pm2 logs cryptorafts --lines 10 --nostream
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

