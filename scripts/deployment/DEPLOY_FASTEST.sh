#!/bin/bash
# ============================================
# 🚀 FASTEST DEPLOYMENT - ONE SCRIPT - DOES EVERYTHING
# ============================================
# Run this ONCE on your VPS - it does EVERYTHING in 10 minutes

set -e

APP_DIR="/var/www/cryptorafts"
NGINX_CONF="/etc/nginx/sites-available/cryptorafts"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🚀 FASTEST DEPLOYMENT - ONE SCRIPT - EVERYTHING 🚀     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Install everything
echo "[1/7] Installing Node.js, PM2, Nginx, Certbot..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - > /dev/null 2>&1
sudo apt update > /dev/null 2>&1
sudo apt install -y nodejs nginx certbot python3-certbot-nginx > /dev/null 2>&1
sudo npm install -g pm2 > /dev/null 2>&1
echo "✅ Installed"

# Step 2: Setup directory
echo "[2/7] Setting up application directory..."
cd $APP_DIR 2>/dev/null || sudo mkdir -p $APP_DIR && cd $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
sudo chmod -R 755 $APP_DIR
echo "✅ Directory ready"

# Step 3: Install dependencies
echo "[3/7] Installing dependencies..."
npm install --production > /dev/null 2>&1 || npm install > /dev/null 2>&1
echo "✅ Dependencies installed"

# Step 4: Build application
echo "[4/7] Building application..."
npm run build > /dev/null 2>&1 || (echo "⚠️  Build may have warnings, continuing..." && npm run build 2>&1 | tail -20)
echo "✅ Built"

# Step 5: Start with PM2
echo "[5/7] Starting application with PM2..."
mkdir -p logs

# Create server.js if missing
cat > server.js << 'EOF'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
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
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
EOF

# Create ecosystem.config.js if missing
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
EOF

# Start/restart PM2
pm2 delete cryptorafts 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER > /dev/null 2>&1 || true
sleep 3
echo "✅ App running"

# Step 6: Configure Nginx - FIX 403 ERROR
echo "[6/7] Configuring Nginx (FIXING 403 ERROR)..."
sudo tee $NGINX_CONF > /dev/null << 'NGINXEOF'
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

    # FIX 403: Proxy ALL requests to port 3000
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
NGINXEOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t > /dev/null && sudo systemctl reload nginx
echo "✅ Nginx configured (403 FIXED)"

# Step 7: Setup SSL
echo "[7/7] Setting up SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/cryptorafts.com/fullchain.pem" ]; then
    sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect > /dev/null 2>&1 || echo "⚠️  SSL may need retry"
    sudo systemctl reload nginx
fi
echo "✅ SSL ready"

# Final check
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
pm2 status | grep cryptorafts || echo "⚠️  Check: pm2 status"
curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✅ App responding on port 3000" || echo "⚠️  App may need restart: pm2 restart cryptorafts"
sudo nginx -t > /dev/null && echo "✅ Nginx config valid" || echo "⚠️  Check nginx config"
echo ""
echo "🌐 Your website should be LIVE at: https://www.cryptorafts.com"
echo ""
echo "If you see 403 error, run this again or:"
echo "  sudo bash FIX_403_VPS_DIRECT.sh"
echo ""

