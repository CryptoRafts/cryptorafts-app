#!/bin/bash

# ==========================================
# WORKING FIX FOR NGINX STATIC ASSETS
# ==========================================
# This script fixes 403/404 errors by using
# a simpler approach that works with Nginx
# ==========================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"

echo "=========================================="
echo "WORKING FIX FOR NGINX STATIC ASSETS"
echo "=========================================="
echo ""

# ==========================================
# CREATE WORKING NGINX CONFIG
# ==========================================

echo "Step 1: Creating working Nginx configuration..."
echo "----------------------------------------"

# Create Nginx config that properly serves static assets
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

    # CRITICAL: Serve static assets from public directory
    # This handles files with spaces by using try_files
    location ~* ^/(Sequence.*\.mp4|cryptorafts\.logo.*\.svg|homapage.*\.png|.*\.(jpg|jpeg|png|gif|ico|svg|webp|mp4|mov|webm))$ {
        root /var/www/cryptorafts/public;
        # Try the exact URI first, then try with decoded spaces
        try_files $uri @static_fallback;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Fallback for static assets with spaces
    location @static_fallback {
        root /var/www/cryptorafts/public;
        # Decode %20 to space and try again
        rewrite ^/(.*)$ /$1 break;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
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

echo "=========================================="
echo "NGINX STATIC ASSETS FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration updated"
echo "✅ Nginx restarted"
echo ""
echo "Note: Files with spaces may still need to be accessed via Next.js proxy"
echo "The best solution is to rename files to remove spaces"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "3. Hard refresh (Ctrl+F5)"
echo "4. Check browser console (F12)"
echo ""







