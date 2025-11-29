#!/bin/bash
# ============================================
# 🔧 COMPLETE FIX FOR 403 FORBIDDEN ERROR
# ============================================
# Run this on your VPS to fix 403 errors

set -e

APP_DIR="/var/www/cryptorafts"
NGINX_CONF="/etc/nginx/sites-available/cryptorafts"
USER="u386122906"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🔧 FIXING 403 FORBIDDEN ERROR 🔧                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Fix permissions
echo "[1/6] Fixing permissions..."
cd $APP_DIR || { echo "❌ Directory not found: $APP_DIR"; exit 1; }
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
echo "✅ Permissions fixed"

# Step 2: Check if app is built
echo ""
echo "[2/6] Checking if app is built..."
if [ ! -d ".next" ]; then
    echo "⚠️  App not built. Building now..."
    npm install --production
    npm run build
    echo "✅ Build complete"
else
    echo "✅ App is built"
fi

# Step 3: Start/restart app with PM2
echo ""
echo "[3/6] Starting/Restarting app with PM2..."
if command -v pm2 &> /dev/null; then
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
            echo "❌ No server file found!"
            exit 1
        fi
    fi
    pm2 save
    echo "✅ App running with PM2"
else
    echo "⚠️  PM2 not installed. Installing..."
    sudo npm install -g pm2
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start server.js --name cryptorafts
    fi
    pm2 save
fi

# Step 4: Wait and verify app is responding
echo ""
echo "[4/6] Verifying app is responding..."
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App responding on port 3000"
else
    echo "⚠️  App not responding. Check logs:"
    pm2 logs cryptorafts --lines 20 --nostream
    echo "⚠️  Continuing anyway..."
fi

# Step 5: Fix Nginx configuration
echo ""
echo "[5/6] Checking Nginx configuration..."
sudo tee $NGINX_CONF > /dev/null << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Next.js app
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

    # Static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
if [ ! -L "/etc/nginx/sites-enabled/cryptorafts" ]; then
    sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/
fi

# Test and reload Nginx
echo ""
echo "[6/6] Testing and reloading Nginx..."
if sudo nginx -t; then
    echo "✅ Nginx config valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config has errors"
    sudo nginx -t
    exit 1
fi

# Final verification
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "PM2 Status:"
pm2 status

echo ""
echo "App Response:"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App responding on port 3000"
else
    echo "❌ App not responding"
    echo "Check logs: pm2 logs cryptorafts"
fi

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -3

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ FIX COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 If still seeing 403 error:"
echo "   1. Check: pm2 logs cryptorafts"
echo "   2. Check: sudo tail -f /var/log/nginx/error.log"
echo "   3. Verify: curl http://localhost:3000"
echo "   4. Check file permissions: ls -la /var/www/cryptorafts"
echo ""

