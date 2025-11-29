#!/bin/bash

# ==========================================
# FINAL FIX FOR NGINX STATIC ASSETS
# ==========================================
# This script fixes 403/404 errors by properly
# configuring Nginx to serve files with spaces
# ==========================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"
APP_DIR="/var/www/cryptorafts"
PUBLIC_DIR="$APP_DIR/public"

echo "=========================================="
echo "FINAL FIX FOR NGINX STATIC ASSETS"
echo "=========================================="
echo ""

# ==========================================
# STEP 1: CREATE FIXED NGINX CONFIG
# ==========================================

echo "Step 1: Creating final Nginx configuration..."
echo "----------------------------------------"

# Create complete Nginx config with proper handling of files with spaces
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

    # Root for public assets
    root /var/www/cryptorafts/public;

    # CRITICAL: Serve video file directly (handles spaces in filename)
    location ~* ^/Sequence.*\.mp4$ {
        alias /var/www/cryptorafts/public/Sequence 01.mp4;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Content-Type "video/mp4";
        access_log off;
    }

    # CRITICAL: Serve logo file directly (handles spaces in filename)
    location ~* ^/cryptorafts\.logo.*\.svg$ {
        alias /var/www/cryptorafts/public/cryptorafts.logo (1).svg;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Content-Type "image/svg+xml";
        access_log off;
    }

    # CRITICAL: Serve background images directly (handles spaces in filename)
    location ~* ^/homapage.*\.png$ {
        root /var/www/cryptorafts/public;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Content-Type "image/png";
        access_log off;
    }

    # Serve all other static assets from public directory
    location ~* ^/([^/]+\.(svg|png|jpg|jpeg|gif|ico|webp|mp4|mov|webm))$ {
        root /var/www/cryptorafts/public;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Serve Next.js static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Next.js API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # CRITICAL: Proxy all other requests to Next.js
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
}
EOF

echo "✅ Nginx configuration created"
echo ""

# ==========================================
# STEP 2: TEST AND RESTART NGINX
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
# STEP 3: VERIFY ASSET ACCESSIBILITY
# ==========================================

echo "Step 3: Verifying asset accessibility..."
echo "----------------------------------------"

# Test logo file (URL-encoded)
echo "A. Testing logo file (URL-encoded)..."
LOGO_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/cryptorafts.logo%20(1).svg" 2>/dev/null || echo "000")
if [ "$LOGO_TEST" = "200" ]; then
    echo "✅ Logo accessible via HTTPS (HTTP $LOGO_TEST)"
else
    echo "⚠️  Logo returning HTTP $LOGO_TEST"
fi
echo ""

# Test video file (URL-encoded)
echo "B. Testing video file (URL-encoded)..."
VIDEO_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/Sequence%2001.mp4" 2>/dev/null || echo "000")
if [ "$VIDEO_TEST" = "200" ]; then
    echo "✅ Video accessible via HTTPS (HTTP $VIDEO_TEST)"
else
    echo "⚠️  Video returning HTTP $VIDEO_TEST"
fi
echo ""

# Test background image (URL-encoded)
echo "C. Testing background image (URL-encoded)..."
IMG_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/homapage%20(3).png" 2>/dev/null || echo "000")
if [ "$IMG_TEST" = "200" ]; then
    echo "✅ Background image accessible via HTTPS (HTTP $IMG_TEST)"
else
    echo "⚠️  Background image returning HTTP $IMG_TEST"
fi
echo ""

echo "=========================================="
echo "NGINX STATIC ASSETS FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration updated"
echo "✅ Nginx restarted"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "3. Hard refresh (Ctrl+F5)"
echo "4. Check browser console (F12) - 403/404 errors should be gone"
echo ""







