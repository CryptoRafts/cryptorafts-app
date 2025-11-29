#!/bin/bash
# ============================================
# FIX REDIRECT LOOP - www.cryptorafts.com
# Fixes the ERR_TOO_MANY_REDIRECTS error
# ============================================

set -e

echo "=========================================="
echo "FIXING REDIRECT LOOP"
echo "=========================================="
echo ""

# Step 1: Fix nginx configuration
echo "[1/3] Fixing nginx configuration..."
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null <<'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://www.cryptorafts.com$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;
    
    # SSL Certificate (set by certbot)
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Redirect non-www to www (only if accessing via cryptorafts.com)
    if ($host = cryptorafts.com) {
        return 301 https://www.cryptorafts.com$request_uri;
    }
    
    # Proxy to Next.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|webp|avif)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Don't cache API routes
    location ~ ^/api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOF

echo "  ✅ Nginx configuration fixed"
echo ""

# Step 2: Test nginx configuration
echo "[2/3] Testing nginx configuration..."
if sudo nginx -t; then
    echo "  ✅ Nginx configuration is valid"
else
    echo "  ❌ Nginx configuration has errors!"
    exit 1
fi
echo ""

# Step 3: Reload nginx
echo "[3/3] Reloading nginx..."
sudo systemctl reload nginx
echo "  ✅ Nginx reloaded"
echo ""

# Summary
echo "=========================================="
echo "✅ REDIRECT LOOP FIXED!"
echo "=========================================="
echo ""
echo "Test your site:"
echo "  curl -I https://www.cryptorafts.com"
echo ""
echo "Or open in browser:"
echo "  https://www.cryptorafts.com"
echo ""

