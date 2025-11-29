#!/bin/bash

# ==========================================
# FIX NGINX 403 FORBIDDEN FOR STATIC ASSETS
# ==========================================
# This script fixes 403 errors for static assets
# by properly configuring Nginx to serve files
# from the /public directory
# ==========================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"
APP_DIR="/var/www/cryptorafts"
PUBLIC_DIR="$APP_DIR/public"

echo "=========================================="
echo "FIX NGINX 403 FORBIDDEN FOR STATIC ASSETS"
echo "=========================================="
echo ""

# ==========================================
# STEP 1: FIX FILE PERMISSIONS
# ==========================================

echo "Step 1: Fixing file permissions..."
echo "----------------------------------------"

# Ensure www-data can read all files in public directory
chmod -R 755 "$PUBLIC_DIR"
chown -R root:www-data "$PUBLIC_DIR"

# Fix specific files with spaces in names
find "$PUBLIC_DIR" -type f -exec chmod 644 {} \;
find "$PUBLIC_DIR" -type d -exec chmod 755 {} \;

echo "✅ File permissions fixed"
echo ""

# ==========================================
# STEP 2: CREATE FIXED NGINX CONFIG
# ==========================================

echo "Step 2: Creating fixed Nginx configuration..."
echo "----------------------------------------"

# Create complete Nginx config with proper static asset serving
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

    # CRITICAL: Serve static assets directly from /public
    # This handles files with spaces in names (URL encoded as %20)
    location ~* ^/(Sequence.*\.mp4|cryptorafts\.logo.*\.svg|homapage.*\.png|.*\.(jpg|jpeg|png|gif|ico|svg|webp|mp4|mov|webm))$ {
        root /var/www/cryptorafts/public;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
        # CRITICAL: Allow access to files
        allow all;
    }

    # Serve all files from public directory (catch-all for static assets)
    location ~* ^/([^/]+\.(svg|png|jpg|jpeg|gif|ico|webp|mp4|mov|webm))$ {
        root /var/www/cryptorafts/public;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
        allow all;
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
# STEP 3: TEST AND RESTART NGINX
# ==========================================

echo "Step 3: Testing and restarting Nginx..."
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
# STEP 4: VERIFY ASSET ACCESSIBILITY
# ==========================================

echo "Step 4: Verifying asset accessibility..."
echo "----------------------------------------"

# Test logo file
echo "A. Testing logo file..."
if [ -f "$PUBLIC_DIR/cryptorafts.logo (1).svg" ]; then
    echo "✅ Logo file exists"
    LOGO_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/cryptorafts.logo%20(1).svg" 2>/dev/null || echo "000")
    if [ "$LOGO_TEST" = "200" ]; then
        echo "✅ Logo accessible via HTTPS"
    else
        echo "⚠️  Logo returning HTTP $LOGO_TEST"
    fi
else
    echo "❌ Logo file not found"
fi
echo ""

# Test video file
echo "B. Testing video file..."
if [ -f "$PUBLIC_DIR/Sequence 01.mp4" ]; then
    echo "✅ Video file exists"
    VIDEO_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/Sequence%2001.mp4" 2>/dev/null || echo "000")
    if [ "$VIDEO_TEST" = "200" ]; then
        echo "✅ Video accessible via HTTPS"
    else
        echo "⚠️  Video returning HTTP $VIDEO_TEST"
    fi
else
    echo "❌ Video file not found at $PUBLIC_DIR/Sequence 01.mp4"
fi
echo ""

# Test background image
echo "C. Testing background image..."
if [ -f "$PUBLIC_DIR/homapage (3).png" ]; then
    echo "✅ Background image exists"
    IMG_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/homapage%20(3).png" 2>/dev/null || echo "000")
    if [ "$IMG_TEST" = "200" ]; then
        echo "✅ Background image accessible via HTTPS"
    else
        echo "⚠️  Background image returning HTTP $IMG_TEST"
    fi
else
    echo "❌ Background image not found"
fi
echo ""

echo "=========================================="
echo "NGINX STATIC ASSETS FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ File permissions fixed"
echo "✅ Nginx configuration updated"
echo "✅ Nginx restarted"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Check browser console (F12) - 403 errors should be gone"
echo ""







