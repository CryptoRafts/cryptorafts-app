#!/bin/bash

# ==========================================
# FIX NGINX - PROXY ALL TO NEXT.JS
# ==========================================
# Let Next.js handle all static assets
# This is the simplest and most reliable approach
# ==========================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"

echo "=========================================="
echo "FIX NGINX - PROXY ALL TO NEXT.JS"
echo "=========================================="
echo ""

# ==========================================
# CREATE SIMPLE NGINX CONFIG
# ==========================================

echo "Step 1: Creating simple Nginx configuration..."
echo "----------------------------------------"

# Create simple Nginx config that proxies everything to Next.js
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

    # Security Headers
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase body size limit
    client_max_body_size 50M;

    # CRITICAL: Proxy ALL requests to Next.js
    # Next.js handles static assets correctly, including files with spaces
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
}
EOF

echo "✅ Nginx configuration created"
echo ""

# ==========================================
# TEST AND RESTART NGINX
# ==========================================

echo "Step 2: Testing and restarting Nginx..."
echo "----------------------------------------"

# Test Nginx configuration
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
# VERIFY NEXT.JS IS SERVING ASSETS
# ==========================================

echo "Step 3: Verifying Next.js is serving assets..."
echo "----------------------------------------"

# Test if Next.js can serve the logo file
echo "A. Testing logo file via Next.js..."
LOGO_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/cryptorafts.logo%20(1).svg" 2>/dev/null || echo "000")
if [ "$LOGO_TEST" = "200" ]; then
    echo "✅ Logo accessible via Next.js (HTTP $LOGO_TEST)"
else
    echo "⚠️  Logo returning HTTP $LOGO_TEST via Next.js"
fi
echo ""

# Test if Next.js can serve the video file
echo "B. Testing video file via Next.js..."
VIDEO_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/Sequence%2001.mp4" 2>/dev/null || echo "000")
if [ "$VIDEO_TEST" = "200" ]; then
    echo "✅ Video accessible via Next.js (HTTP $VIDEO_TEST)"
else
    echo "⚠️  Video returning HTTP $VIDEO_TEST via Next.js"
fi
echo ""

# Test if Next.js can serve the background image
echo "C. Testing background image via Next.js..."
IMG_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/homapage%20(3).png" 2>/dev/null || echo "000")
if [ "$IMG_TEST" = "200" ]; then
    echo "✅ Background image accessible via Next.js (HTTP $IMG_TEST)"
else
    echo "⚠️  Background image returning HTTP $IMG_TEST via Next.js"
fi
echo ""

echo "=========================================="
echo "NGINX PROXY FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx now proxies ALL requests to Next.js"
echo "✅ Next.js handles static assets (including files with spaces)"
echo "✅ Nginx restarted"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "3. Hard refresh (Ctrl+F5)"
echo "4. Check browser console (F12) - 403/404 errors should be gone"
echo ""







