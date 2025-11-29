#!/bin/bash

# ==========================================
# FIX NGINX STATIC ASSETS - CORRECT PATH
# ==========================================
# This script fixes the Nginx configuration
# to properly serve static assets
# ==========================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"

echo "=========================================="
echo "FIX NGINX STATIC ASSETS - CORRECT PATH"
echo "=========================================="
echo ""

# ==========================================
# FIX NGINX CONFIGURATION
# ==========================================

echo "Fixing Nginx configuration for static assets..."
echo "----------------------------------------"

# Create corrected Nginx config
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

    # CRITICAL: Serve Next.js static assets directly
    # The URL is /_next/static/... but files are in .next/static/...
    location /_next/static/ {
        alias /var/www/cryptorafts/.next/static/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
        
        # Ensure proper MIME types
        include /etc/nginx/mime.types;
        default_type application/octet-stream;
        
        # Specific MIME types for common files
        location ~* \.css$ {
            add_header Content-Type "text/css";
        }
        location ~* \.js$ {
            add_header Content-Type "application/javascript";
        }
    }

    # Serve public folder files directly
    location /Sequence {
        alias /var/www/cryptorafts/public;
        try_files $uri =404;
    }

    # Serve other public assets
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|mp4|webm)$ {
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

# Test static asset
echo "Testing static asset accessibility..."
sleep 2
ASSET_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost/_next/static/css/5aa461682c405590.css 2>/dev/null || echo "000")
if [ "$ASSET_TEST" = "200" ]; then
    echo "✅ Static assets are now accessible via Nginx HTTPS"
elif [ "$ASSET_TEST" = "404" ]; then
    echo "⚠️  Static assets returning 404 - checking path..."
    echo "Asset path: /_next/static/css/5aa461682c405590.css"
    echo "File location: /var/www/cryptorafts/.next/static/css/"
    ls -la /var/www/cryptorafts/.next/static/css/ | head -5
else
    echo "⚠️  Static assets returning HTTP $ASSET_TEST"
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
echo "3. Test in Incognito window"
echo "4. Check browser console (F12) for any asset loading errors"
echo ""

