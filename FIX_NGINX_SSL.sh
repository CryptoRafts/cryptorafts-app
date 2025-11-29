#!/bin/bash
# ============================================
# FIX NGINX SSL CONFIGURATION
# Fixes the SSL certificate error
# ============================================

set -e

echo "=========================================="
echo "FIXING NGINX SSL CONFIGURATION"
echo "=========================================="
echo ""

# Step 1: Fix nginx config to listen on 443 without SSL first
echo "[1/4] Fixing nginx configuration..."
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null <<'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://www.cryptorafts.com$request_uri;
}

# HTTPS Server Block (without SSL first - certbot will add SSL)
server {
    listen 443 http2;
    listen [::]:443 http2;
    server_name www.cryptorafts.com cryptorafts.com;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
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
echo "[2/4] Testing nginx configuration..."
if sudo nginx -t; then
    echo "  ✅ Nginx configuration is valid"
else
    echo "  ❌ Nginx configuration still has errors!"
    exit 1
fi
echo ""

# Step 3: Reload nginx
echo "[3/4] Reloading nginx..."
sudo systemctl reload nginx
echo "  ✅ Nginx reloaded"
echo ""

# Step 4: Get SSL certificate with certbot
echo "[4/4] Getting SSL certificate with certbot..."
echo "  This will prompt for email address..."
echo ""

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "  Installing certbot..."
    sudo apt-get update -qq
    sudo apt-get install -y certbot python3-certbot-nginx
    echo "  ✅ Certbot installed"
fi

# Get SSL certificate
echo "  Getting SSL certificate..."
sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --redirect --email admin@cryptorafts.com 2>&1 || {
    echo ""
    echo "  ⚠️  Certbot failed. You may need to run manually:"
    echo "     sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com"
    echo ""
    echo "  Or verify DNS is pointing to this server first:"
    echo "     dig cryptorafts.com"
    echo "     dig www.cryptorafts.com"
    exit 1
}

# Final reload
sudo systemctl reload nginx
echo ""
echo "  ✅ SSL certificate installed"
echo ""

# Summary
echo "=========================================="
echo "✅ NGINX SSL CONFIGURATION FIXED!"
echo "=========================================="
echo ""
echo "Your site should now be accessible at:"
echo "  ✅ https://www.cryptorafts.com"
echo "  ✅ https://cryptorafts.com (redirects to www)"
echo ""
echo "Test your site:"
echo "  curl -I https://www.cryptorafts.com"
echo ""
echo "Check nginx status:"
echo "  sudo systemctl status nginx"
echo ""

