#!/bin/bash

# ==========================================
# FIX HTTPS NGINX CONFIG - FORCE HTTPS PROTO
# ==========================================
# This script fixes the Nginx config to ensure
# Next.js knows it's being served over HTTPS
# ==========================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/final-prod.conf"

echo "=========================================="
echo "FIX HTTPS NGINX CONFIG - FORCE HTTPS PROTO"
echo "=========================================="
echo ""

# Backup current config
echo "Step 1: Backing up current Nginx config..."
sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup"
echo "✅ Config backed up"
echo ""

# Create fixed HTTPS config
echo "Step 2: Creating fixed HTTPS Nginx configuration..."
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

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Increase body size limit
    client_max_body_size 50M;

    # Root location for direct asset serving (Video, Images)
    root /var/www/cryptorafts/public;

    # CRITICAL: Serve Next.js assets directly from the build folder for speed
    location /_next/static {
        alias /var/www/cryptorafts/.next/static;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # CRITICAL: Proxy all traffic (for SSR pages and API routes)
    location / {
        proxy_pass http://localhost:3000;
        
        # ESSENTIAL HEADERS (Host must be passed correctly)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;  # CRITICAL: Force HTTPS for Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Next.js API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;  # CRITICAL: Force HTTPS for Next.js
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "✅ Fixed HTTPS Nginx config created"
echo ""

# Test and restart Nginx
echo "Step 3: Testing and restarting Nginx..."
if sudo nginx -t 2>/dev/null; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl restart nginx
    echo "✅ Nginx restarted"
else
    echo "❌ Nginx configuration has errors:"
    sudo nginx -t
    echo "Restoring backup..."
    sudo cp "$NGINX_CONFIG.backup" "$NGINX_CONFIG"
    exit 1
fi
echo ""

# Verify deployment
echo "Step 4: Verifying deployment..."
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
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://localhost/ 2>/dev/null || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ HTTPS responding with 200 OK"
elif [ "$HTTPS_RESPONSE" = "000" ]; then
    echo "⚠️  HTTPS not responding (may need to test from external)"
else
    echo "⚠️  HTTPS responding with HTTP $HTTPS_RESPONSE"
fi
echo ""

# Test content via HTTPS
echo "C. Testing content via HTTPS..."
if curl -s -k https://localhost/ 2>/dev/null | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Content is accessible via HTTPS"
else
    echo "⚠️  Content may not be accessible via HTTPS"
fi
echo ""

# ==========================================
# FINAL SUMMARY
# ==========================================

echo "=========================================="
echo "HTTPS NGINX CONFIG FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx config updated with X-Forwarded-Proto: https"
echo "✅ Nginx restarted"
echo "✅ HTTPS is configured"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo ""
echo "The X-Forwarded-Proto header is now explicitly set to 'https'"
echo "so Next.js will generate correct HTTPS asset URLs."
echo ""

