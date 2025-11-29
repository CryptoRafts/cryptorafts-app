#!/bin/bash

# ==========================================
# FIX NGINX - PROXY STATIC ASSETS TO NEXT.JS
# ==========================================
# This script updates Nginx to proxy all
# requests (including static assets) to Next.js
# ==========================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"

echo "=========================================="
echo "FIX NGINX - PROXY STATIC ASSETS TO NEXT.JS"
echo "=========================================="
echo ""

# ==========================================
# FIX NGINX CONFIGURATION
# ==========================================

echo "Updating Nginx to proxy all requests to Next.js..."
echo "----------------------------------------"

# Create simplified Nginx config that proxies everything to Next.js
cat << 'EOF' | sudo tee "$NGINX_CONFIG" > /dev/null
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name www.cryptorafts.com cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;

    # Increase body size limit
    client_max_body_size 50M;

    # CRITICAL: Proxy ALL requests to Next.js (including static assets)
    # Next.js handles static assets correctly
    location / {
        proxy_pass http://localhost:3000;
        
        # ESSENTIAL HEADERS
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        
        # Disable buffering for streaming responses
        proxy_buffering off;
        
        # Cache static assets
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    # Next.js API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
}
EOF

echo "✅ Nginx configuration updated"
echo ""

# Test and restart Nginx
echo "Testing Nginx configuration..."
if sudo nginx -t 2>/dev/null; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl restart nginx
    echo "✅ Nginx restarted"
else
    echo "❌ Nginx configuration has errors:"
    sudo nginx -t
    exit 1
fi
echo ""

# Wait for Nginx to restart
echo "Waiting for Nginx to restart..."
sleep 3
echo "✅ Wait complete"
echo ""

# Test static asset accessibility
echo "Testing static asset accessibility..."
ASSET_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost/_next/static/css/5aa461682c405590.css 2>/dev/null || echo "000")
if [ "$ASSET_TEST" = "200" ]; then
    echo "✅ Static assets are now accessible via Nginx HTTPS"
else
    echo "⚠️  Static assets returning HTTP $ASSET_TEST"
    echo "Checking if Next.js is serving the asset..."
    NEXTJS_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_next/static/css/5aa461682c405590.css 2>/dev/null || echo "000")
    if [ "$NEXTJS_TEST" = "200" ]; then
        echo "✅ Next.js is serving the asset correctly"
        echo "The issue may be with Nginx proxy configuration"
    else
        echo "⚠️  Next.js is also returning HTTP $NEXTJS_TEST"
    fi
fi
echo ""

# Test main page
echo "Testing main page..."
PAGE_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost/ 2>/dev/null || echo "000")
if [ "$PAGE_TEST" = "200" ]; then
    echo "✅ Main page is accessible via HTTPS"
else
    echo "⚠️  Main page returning HTTP $PAGE_TEST"
fi
echo ""

echo "=========================================="
echo "NGINX PROXY FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration updated to proxy all requests to Next.js"
echo "✅ Nginx restarted"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo "4. Check browser console (F12) for any errors"
echo ""

