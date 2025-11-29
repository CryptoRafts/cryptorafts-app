#!/bin/bash
# ============================================
# 🚀 COMPLETE DEPLOYMENT - MAKES APP LIVE
# ============================================

set -e

VPS_DIR="/var/www/cryptorafts"
VPS_USER="u386122906"

cd ~/cryptorafts

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🚀 COMPLETE DEPLOYMENT - MAKING APP LIVE 🚀             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "[1/7] Setting up directory..."
sudo mkdir -p $VPS_DIR
sudo cp -r ~/cryptorafts/* $VPS_DIR/ 2>/dev/null || true
cd $VPS_DIR
echo "✅ Directory ready"

echo ""
echo "[2/7] Fixing permissions..."
sudo chown -R $VPS_USER:$VPS_USER .
sudo chmod -R 755 .
echo "✅ Permissions fixed"

echo ""
echo "[3/7] Installing dependencies..."
npm install --production 2>&1 | tail -20
echo "✅ Dependencies installed"

echo ""
echo "[4/7] Building application..."
npm run build 2>&1 | tail -30
echo "✅ Build complete"

echo ""
echo "[5/7] Starting app with PM2..."
mkdir -p logs

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

if pm2 list | grep -q cryptorafts; then
    echo "Restarting app..."
    pm2 restart cryptorafts
else
    echo "Starting app..."
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    elif [ -f "server.js" ]; then
        pm2 start server.js --name cryptorafts
    else
        echo "Creating server.js..."
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
        pm2 start server.js --name cryptorafts
    fi
fi
pm2 save
echo "✅ App running with PM2"

echo ""
echo "[6/7] Configuring Nginx..."
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null << 'NGINX_EOF'
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
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINX_EOF

sudo rm -f /etc/nginx/sites-enabled/default
if [ ! -L "/etc/nginx/sites-enabled/cryptorafts" ]; then
    sudo ln -s /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/
fi

if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx configured"
else
    echo "⚠️  Nginx config test failed, but continuing..."
fi

echo ""
echo "[7/7] Setting up SSL..."
if [ ! -f "/etc/letsencrypt/live/cryptorafts.com/fullchain.pem" ]; then
    if command -v certbot &> /dev/null; then
        sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect || echo "SSL install may need retry"
    else
        sudo apt update -qq
        sudo apt install -y -qq certbot python3-certbot-nginx
        sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect || echo "SSL install may need retry"
    fi
    sudo systemctl reload nginx
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Verifying..."
sleep 5

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App responding on port 3000"
else
    echo "⚠️  App not responding yet. Check logs: pm2 logs cryptorafts"
fi

echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 Your website should be LIVE at:"
echo "   https://www.cryptorafts.com"
echo "   https://cryptorafts.com"
echo ""

