#!/bin/bash
# Run this script in your SSH terminal
# Copy and paste these commands directly into SSH terminal

set -e

echo ""
echo "======================================================"
echo "  DEPLOYING CRYPTORAFTS - AUTOMATED"
echo "======================================================"
echo ""

APP_DIR="$HOME/cryptorafts"
USER="u386122906"

# Step 1: Create directory
echo "[1/6] Creating directory..."
mkdir -p $APP_DIR
cd $APP_DIR
echo "✅ Directory created: $APP_DIR"
echo ""

# Step 2: Check if files exist
echo "[2/6] Checking for files..."
if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ Files NOT uploaded yet!"
    echo ""
    echo "You need to upload files first via FileZilla:"
    echo "  1. Connect: sftp://145.79.211.130:65002"
    echo "  2. Username: u386122906"
    echo "  3. Password: Shamsi2627@@"
    echo "  4. Upload ALL files from C:\Users\dell\cryptorafts-starter"
    echo "  5. Upload to: ~/cryptorafts/"
    echo ""
    echo "After uploading, run this script again."
    exit 1
fi
echo "✅ Files found!"
echo ""

# Step 3: Fix permissions
echo "[3/6] Fixing permissions..."
chmod -R 755 .
chown -R $USER:$USER .
echo "✅ Permissions fixed"
echo ""

# Step 4: Install dependencies
echo "[4/6] Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install --production
else
    npm install --production
fi
echo "✅ Dependencies installed"
echo ""

# Step 5: Build application
echo "[5/6] Building application..."
echo "⏱️  This will take 3-5 minutes..."
rm -rf .next
rm -rf out
NODE_ENV=production npm run build 2>&1 | tail -50
echo "✅ Build complete"
echo ""

# Step 6: Start with PM2
echo "[6/6] Starting application with PM2..."

# Create server.js if missing
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

# Install PM2 if needed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Create ecosystem.config.js if missing
if [ ! -f "ecosystem.config.js" ]; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
  }],
};
EOF
fi

# Create logs directory
mkdir -p logs

# Stop existing app
if pm2 list | grep -q cryptorafts; then
    pm2 stop cryptorafts
    pm2 delete cryptorafts
fi

# Start app
pm2 start ecosystem.config.js
pm2 save

echo "✅ App started with PM2"
echo ""

# Step 7: Configure Nginx
echo "[7/7] Configuring Nginx..."
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/

# Test and reload
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx configured"
else
    echo "⚠️  Nginx config test failed"
fi
echo ""

# Final status
echo "======================================================"
echo "  DEPLOYMENT COMPLETE!"
echo "======================================================"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "App logs (last 20 lines):"
pm2 logs cryptorafts --lines 20 --nostream
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

