#!/bin/bash

# ==========================================
# FINAL UI FIX - ENSURE ASSETS LOAD CORRECTLY
# ==========================================
# This script:
# 1. Verifies Nginx is serving static assets correctly
# 2. Ensures proper MIME types
# 3. Fixes any asset path issues
# 4. Restarts services
# ==========================================

set -e

APP_DIR="/var/www/cryptorafts"
NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"

echo "=========================================="
echo "FINAL UI FIX - ENSURE ASSETS LOAD CORRECTLY"
echo "=========================================="
echo ""

cd "$APP_DIR" || exit 1
echo "✅ Working directory: $(pwd)"
echo ""

# ==========================================
# STEP 1: VERIFY STATIC ASSETS EXIST
# ==========================================

echo "Step 1: Verifying static assets exist..."
echo "----------------------------------------"

if [ -d ".next/static" ]; then
    echo "✅ .next/static directory exists"
    STATIC_COUNT=$(find .next/static -type f | wc -l)
    echo "✅ Found $STATIC_COUNT static files"
else
    echo "❌ .next/static directory not found!"
    echo "Rebuilding application..."
    npm run build
    echo "✅ Build completed"
fi
echo ""

# ==========================================
# STEP 2: FIX NGINX CONFIGURATION
# ==========================================

echo "Step 2: Fixing Nginx configuration..."
echo "----------------------------------------"

# Create optimized Nginx config that properly serves static assets
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

    # Root for public assets
    root /var/www/cryptorafts/public;

    # CRITICAL: Serve Next.js static assets directly with proper headers
    location /_next/static {
        alias /var/www/cryptorafts/.next/static;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
        
        # Ensure proper MIME types
        types {
            application/javascript js;
            text/css css;
            application/json json;
            image/png png;
            image/jpeg jpg jpeg;
            image/svg+xml svg;
            image/webp webp;
            font/woff2 woff2;
            font/woff woff;
            font/ttf ttf;
        }
    }

    # Serve public folder files directly
    location /Sequence {
        alias /var/www/cryptorafts/public;
        try_files $uri =404;
    }

    # Serve other public assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /var/www/cryptorafts/public;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # CRITICAL: Proxy all other traffic to Next.js
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

# ==========================================
# STEP 3: RESTART PM2
# ==========================================

echo "Step 3: Restarting PM2..."
echo "----------------------------------------"

pm2 restart cryptorafts
pm2 save
echo "✅ PM2 restarted"
echo ""

# Wait for app to start
echo "Waiting for application to start..."
sleep 10
echo "✅ Wait complete"
echo ""

# ==========================================
# STEP 4: VERIFY DEPLOYMENT
# ==========================================

echo "Step 4: Verifying deployment..."
echo "----------------------------------------"

# Check PM2 Status
echo "A. Checking PM2 Status..."
pm2 status cryptorafts
echo ""

# Test localhost response
echo "B. Testing localhost response..."
LOCALHOST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$LOCALHOST_RESPONSE" = "200" ]; then
    echo "✅ Localhost responding with 200 OK"
else
    echo "❌ Localhost responding with HTTP $LOCALHOST_RESPONSE"
fi
echo ""

# Check for asset paths in HTML
echo "C. Checking for asset paths in HTML..."
ASSET_PATHS=$(curl -s http://localhost:3000/ 2>/dev/null | grep -o '/_next/static/[^"]*' | head -3)
if [ -n "$ASSET_PATHS" ]; then
    echo "✅ Found asset paths in HTML:"
    echo "$ASSET_PATHS" | head -3
else
    echo "⚠️  No asset paths found in HTML"
fi
echo ""

# Test static asset accessibility
echo "D. Testing static asset accessibility..."
if [ -n "$ASSET_PATHS" ]; then
    FIRST_ASSET=$(echo "$ASSET_PATHS" | head -1)
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$FIRST_ASSET" 2>/dev/null | grep -q "200"; then
        echo "✅ Static assets are accessible via Next.js"
    else
        echo "⚠️  Static assets may not be accessible"
    fi
fi
echo ""

# Test HTTPS response
echo "E. Testing HTTPS response..."
HTTPS_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost/ 2>/dev/null || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ HTTPS responding with 200 OK"
else
    echo "⚠️  HTTPS responding with HTTP $HTTPS_RESPONSE"
fi
echo ""

# Test static asset via Nginx
echo "F. Testing static asset via Nginx..."
if [ -n "$ASSET_PATHS" ]; then
    FIRST_ASSET=$(echo "$ASSET_PATHS" | head -1)
    if curl -s -k -o /dev/null -w "%{http_code}" "https://localhost$FIRST_ASSET" 2>/dev/null | grep -q "200"; then
        echo "✅ Static assets are accessible via Nginx HTTPS"
    else
        echo "⚠️  Static assets may not be accessible via Nginx"
    fi
fi
echo ""

# ==========================================
# FINAL SUMMARY
# ==========================================

echo "=========================================="
echo "FINAL UI FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Static assets verified"
echo "✅ Nginx configuration updated with proper static asset serving"
echo "✅ Nginx restarted"
echo "✅ PM2 restarted"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo "4. Check browser console for any errors (F12)"
echo ""
echo "If still not working:"
echo "- Check PM2 logs: pm2 logs cryptorafts --lines 50"
echo "- Check Nginx logs: tail -f /var/log/nginx/error.log"
echo "- Check browser console for asset loading errors"
echo ""

