#!/bin/bash
# Fix Nginx Configuration for Next.js

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING NGINX FOR NEXT.JS"
echo "=========================================="
echo ""

# Backup current config
cp /etc/nginx/sites-enabled/cryptorafts /etc/nginx/sites-enabled/cryptorafts.backup.$(date +%s)
echo "✅ Config backed up"
echo ""

# Create fixed Nginx config
cat > /tmp/nginx_nextjs_fixed.conf << 'NGINX_EOF'
# Upstream block for Next.js server
upstream nextjs_backend {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # MIME types
    include /etc/nginx/mime.types;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection '1; mode=block' always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Redirect non-www to www
    if ($host = cryptorafts.com) {
        return 301 https://www.cryptorafts.com$request_uri;
    }

    # CRITICAL: Next.js static files MUST come first (before regex patterns)
    # This ensures /_next/static files are served correctly
    location /_next/static {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Cache static assets
        proxy_cache_valid 200 365d;
        expires 365d;
        add_header Cache-Control "public, immutable";
        
        # Ensure correct MIME types
        types {
            text/css css;
            application/javascript js;
            application/json json;
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # API routes
    location ~ ^/api/ {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "no-store, no-cache, must-revalidate";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve public static files (images, fonts, etc.) - but NOT /_next/static
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|webp|avif|mp4|webm)$ {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Cache public assets
        proxy_cache_valid 200 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # CRITICAL: Main location block for Next.js
    # This handles all routes and proxies to Next.js server
    # Next.js handles client-side routing internally
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;

        # Cache-busting headers for HTML
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;

        # Retry on failure
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 10s;
    }
}
NGINX_EOF

# Remove all backup files
rm -f /etc/nginx/sites-enabled/cryptorafts.backup.*
rm -f /etc/nginx/sites-available/cryptorafts.backup.*

# Install fixed config
mv /tmp/nginx_nextjs_fixed.conf /etc/nginx/sites-enabled/cryptorafts

echo "✅ Nginx config updated"
echo ""

# Test config
echo "Testing Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config is valid"
    
    # Reload Nginx
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config is invalid"
    nginx -t 2>&1 | grep -i error
    echo ""
    echo "Restoring backup..."
    mv /etc/nginx/sites-enabled/cryptorafts.backup.* /etc/nginx/sites-enabled/cryptorafts 2>/dev/null || true
    exit 1
fi
echo ""

# Test static assets
echo "Testing static assets..."
sleep 2

CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)

if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
    CSS_STATUS=$(curl -I "$CSS_URL" 2>&1 | head -1)
    CSS_TYPE=$(curl -I "$CSS_URL" 2>&1 | grep -i "content-type" || echo "")
    
    if echo "$CSS_STATUS" | grep -q "200"; then
        echo "✅ CSS accessible: $CSS_BASENAME"
        echo "   $CSS_TYPE"
    else
        echo "❌ CSS not accessible"
    fi
fi

if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
    JS_STATUS=$(curl -I "$JS_URL" 2>&1 | head -1)
    JS_TYPE=$(curl -I "$JS_URL" 2>&1 | grep -i "content-type" || echo "")
    
    if echo "$JS_STATUS" | grep -q "200"; then
        echo "✅ JS accessible: $JS_BASENAME"
        echo "   $JS_TYPE"
    else
        echo "❌ JS not accessible"
    fi
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configured for Next.js"
echo "✅ Static assets location block prioritized"
echo "✅ MIME types configured"
echo ""
echo "NEXT STEPS:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Open DevTools (F12) → Network tab"
echo "3. Check 'Disable cache'"
echo "4. Refresh page (Ctrl+R)"
echo "5. Check if CSS/JS files load (should be 200 OK)"
echo "6. Check Console for any errors"
echo ""

