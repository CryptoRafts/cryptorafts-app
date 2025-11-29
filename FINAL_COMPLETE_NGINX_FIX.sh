#!/bin/bash

# ==========================================
# FINAL COMPLETE NGINX FIX - ALL FIXES
# ==========================================
# This script:
# 1. Creates complete Nginx config with:
#    - Direct asset serving (video, images)
#    - Security headers
#    - Proper proxy configuration
# 2. Restarts Nginx
# 3. Verifies deployment
# ==========================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"
APP_DIR="/var/www/cryptorafts"

echo "=========================================="
echo "FINAL COMPLETE NGINX FIX - ALL FIXES"
echo "=========================================="
echo ""

# ==========================================
# STEP 1: CREATE COMPLETE NGINX CONFIG
# ==========================================

echo "Step 1: Creating complete Nginx configuration..."
echo "----------------------------------------"

# Create complete Nginx config with all fixes
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

    # FIX 4: Security Headers - Browser Trust
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase body size limit
    client_max_body_size 50M;

    # Root for public assets
    root /var/www/cryptorafts/public;

    # FIX 3: Direct Asset Serving - Video and Images
    # Serve video file directly
    location ~* ^/Sequence.*\.mp4$ {
        alias /var/www/cryptorafts/public;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Content-Type "video/mp4";
        access_log off;
    }

    # Serve images directly
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        root /var/www/cryptorafts/public;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Serve other public assets directly
    location ~* ^/(cryptorafts\.logo|homapage|tablogo|favicon) {
        root /var/www/cryptorafts/public;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # CRITICAL: Proxy ALL other requests to Next.js (including static assets)
    # Next.js handles static assets correctly with assetPrefix
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

echo "✅ Nginx configuration created with all fixes"
echo ""

# ==========================================
# STEP 2: LINK AND RESTART NGINX
# ==========================================

echo "Step 2: Linking and restarting Nginx..."
echo "----------------------------------------"

# Remove old configs
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/cryptorafts.com
sudo rm -f /etc/nginx/sites-enabled/http-only.conf
sudo rm -f /etc/nginx/sites-enabled/final-prod.conf

# Link new config
sudo ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/
echo "✅ Nginx config linked"
echo ""

# Test Nginx configuration
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
# STEP 3: VERIFY DEPLOYMENT
# ==========================================

echo "Step 3: Verifying deployment..."
echo "----------------------------------------"

# Check Nginx status
echo "A. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl start nginx
    echo "✅ Nginx started"
fi
echo ""

# Test HTTPS response
echo "B. Testing HTTPS response..."
HTTPS_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost/ 2>/dev/null || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ HTTPS responding with 200 OK"
else
    echo "⚠️  HTTPS responding with HTTP $HTTPS_RESPONSE"
fi
echo ""

# Test video asset accessibility
echo "C. Testing video asset accessibility..."
if [ -f "$APP_DIR/public/Sequence 01.mp4" ]; then
    echo "✅ Video file exists"
    VIDEO_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/Sequence%2001.mp4" 2>/dev/null || echo "000")
    if [ "$VIDEO_TEST" = "200" ]; then
        echo "✅ Video asset accessible via HTTPS"
    else
        echo "⚠️  Video asset returning HTTP $VIDEO_TEST"
    fi
else
    echo "⚠️  Video file not found at $APP_DIR/public/Sequence 01.mp4"
fi
echo ""

# Test static asset accessibility
echo "D. Testing static asset accessibility..."
ASSET_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/_next/static/css/5aa461682c405590.css" 2>/dev/null || echo "000")
if [ "$ASSET_TEST" = "200" ]; then
    echo "✅ Static assets accessible via HTTPS"
else
    echo "⚠️  Static assets returning HTTP $ASSET_TEST"
fi
echo ""

# Check security headers
echo "E. Checking security headers..."
HEADERS=$(curl -s -k -I https://localhost/ 2>/dev/null | grep -i "x-content-type-options\|referrer-policy" || echo "")
if [ -n "$HEADERS" ]; then
    echo "✅ Security headers present"
    echo "$HEADERS"
else
    echo "⚠️  Security headers may be missing"
fi
echo ""

echo "=========================================="
echo "FINAL COMPLETE NGINX FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration created with:"
echo "   - Direct asset serving (video, images)"
echo "   - Security headers"
echo "   - Proper proxy configuration"
echo "✅ Nginx restarted"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo "4. Check browser console (F12) for any errors"
echo ""







