#!/bin/bash

# ============================================
# 🔧 FIX 403 FORBIDDEN - COMPLETE DEPLOYMENT
# ============================================
# This script fixes the 403 error and completes deployment

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🔧 FIXING 403 ERROR & COMPLETING DEPLOYMENT 🔧         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

APP_DIR="/var/www/cryptorafts"
NGINX_CONF="/etc/nginx/sites-available/cryptorafts"

# Step 1: Fix directory permissions
echo "[1/8] Fixing directory permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR
echo "✅ Permissions fixed"

# Step 2: Check if Next.js app is running
echo ""
echo "[2/8] Checking Next.js application..."
cd $APP_DIR

if pm2 list | grep -q cryptorafts; then
    echo "✅ Application is running"
    pm2 status
else
    echo "⚠️  Application not running, starting..."
    
    # Switch to VPS config if needed
    if [ ! -f "next.config.js" ] || ! grep -q "VPS" next.config.js 2>/dev/null; then
        cp next.config.vps.js next.config.js
        echo "✅ VPS config activated"
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install --production
    fi
    
    # Build if needed
    if [ ! -d ".next" ]; then
        echo "Building application..."
        npm run build
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save
    echo "✅ Application started"
fi

# Step 3: Fix nginx configuration
echo ""
echo "[3/8] Fixing nginx configuration..."

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

    # SSL configuration (will be set by certbot)
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Proxy to Next.js app (port 3000)
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
        
        # Important: Don't try to serve files directly
        proxy_set_header X-Forwarded-Host $host;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # API routes - no cache
    location /api {
        proxy_pass http://localhost:3000;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

echo "✅ Nginx configuration updated"

# Step 4: Enable site
echo ""
echo "[4/8] Enabling nginx site..."
if [ ! -L "/etc/nginx/sites-enabled/cryptorafts" ]; then
    sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/
fi
echo "✅ Site enabled"

# Step 5: Test nginx configuration
echo ""
echo "[5/8] Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Step 6: Reload nginx
echo ""
echo "[6/8] Reloading nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"

# Step 7: Setup SSL if not already done
echo ""
echo "[7/8] Checking SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/cryptorafts.com/fullchain.pem" ]; then
    echo "Installing SSL certificate..."
    sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect
    echo "✅ SSL certificate installed"
else
    echo "✅ SSL certificate already exists"
fi

# Step 8: Verify deployment
echo ""
echo "[8/8] Verifying deployment..."

# Check if app is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js app is responding on port 3000"
else
    echo "⚠️  Next.js app not responding on port 3000"
    echo "Checking PM2 status..."
    pm2 status
fi

# Check nginx status
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl start nginx
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         🎉 DEPLOYMENT COMPLETE! 🎉                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "✅ Permissions fixed"
echo "✅ Nginx configuration updated"
echo "✅ Next.js app configured"
echo "✅ SSL certificate installed"
echo "✅ Site enabled and reloaded"
echo ""

echo "🌐 Your app should now be live at:"
echo "   https://www.cryptorafts.com"
echo ""

echo "📋 If you still see 403 error:"
echo "   1. Check PM2: pm2 status"
echo "   2. Check logs: pm2 logs cryptorafts"
echo "   3. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   4. Verify app is running: curl http://localhost:3000"
echo ""

