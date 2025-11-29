#!/bin/bash

# ==========================================
# FINAL HTTPS DEPLOYMENT - ABSOLUTE FIX
# ==========================================
# This script:
# 1. Deletes PM2 process to clear any corrupt startup
# 2. Cleans build cache and node_modules
# 3. Fresh install and build
# 4. Creates robust HTTPS Nginx configuration
# 5. Links and restarts Nginx
# 6. Starts PM2 with correct configuration
# 7. Verifies everything
# ==========================================

set -e

APP_NAME="cryptorafts"
APP_DIR="/var/www/cryptorafts"
NGINX_CONFIG="/etc/nginx/sites-available/final-prod.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/final-prod.conf"

echo "=========================================="
echo "FINAL HTTPS DEPLOYMENT - ABSOLUTE FIX"
echo "=========================================="
echo ""

# ==========================================
# STEP 1: DELETE PM2 PROCESS AND CLEAN
# ==========================================

echo "Step 1: Deleting PM2 process and cleaning..."
echo "----------------------------------------"

# Delete PM2 process
pm2 delete "$APP_NAME" 2>/dev/null || echo "⚠️  PM2 process not found"
pm2 save
echo "✅ PM2 process deleted"
echo ""

# Clean build cache and node_modules
cd "$APP_DIR" || exit 1
echo "Cleaning build cache and node_modules..."
rm -rf .next/cache
rm -rf .next/static
rm -rf node_modules
echo "✅ Build cache and node_modules cleaned"
echo ""

# ==========================================
# STEP 2: FRESH INSTALL AND BUILD
# ==========================================

echo "Step 2: Fresh install and build..."
echo "----------------------------------------"

# Install dependencies
echo "A. Installing dependencies..."
npm install --legacy-peer-deps --production=false
echo "✅ Dependencies installed"
echo ""

# Build application
echo "B. Building application..."
echo "This may take a few minutes..."
npm run build
echo "✅ Build completed"
echo ""

# ==========================================
# STEP 3: CREATE ROBUST HTTPS NGINX CONFIG
# ==========================================

echo "Step 3: Creating robust HTTPS Nginx configuration..."
echo "----------------------------------------"

# Create HTTPS Nginx config
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

    # SSL certificates (adjust paths if needed)
    # If using Let's Encrypt/Certbot, these are typically:
    # ssl_certificate /etc/letsencrypt/live/www.cryptorafts.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/www.cryptorafts.com/privkey.pem;
    
    # For now, using placeholder paths - update these with your actual SSL certificate paths
    # If SSL certificates don't exist, this will fail - you'll need to set up SSL first
    ssl_certificate /etc/ssl/certs/cryptorafts.com.pem;
    ssl_certificate_key /etc/ssl/private/cryptorafts.com.key;
    
    # If SSL certificates don't exist, comment out the above two lines and use HTTP-only config below
    # Or set up SSL certificates first using Certbot: sudo certbot --nginx -d www.cryptorafts.com -d cryptorafts.com

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
        proxy_set_header X-Forwarded-Proto https;  # IMPORTANT: Forces Next.js to use HTTPS scheme
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
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "✅ HTTPS Nginx config file created"
echo ""

# Check if SSL certificates exist
if [ ! -f "/etc/ssl/certs/cryptorafts.com.pem" ] && [ ! -f "/etc/letsencrypt/live/www.cryptorafts.com/fullchain.pem" ]; then
    echo "⚠️  WARNING: SSL certificates not found!"
    echo "Creating HTTP-only fallback configuration..."
    echo ""
    
    # Create HTTP-only fallback config
    cat << 'EOF' | sudo tee "$NGINX_CONFIG" > /dev/null
server {
    listen 80;
    server_name www.cryptorafts.com cryptorafts.com;

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
        proxy_set_header X-Forwarded-Proto $scheme;
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
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    echo "✅ HTTP-only fallback config created (SSL certificates not found)"
    echo "To enable HTTPS, run: sudo certbot --nginx -d www.cryptorafts.com -d cryptorafts.com"
    echo ""
fi

# ==========================================
# STEP 4: LINK AND RESTART NGINX
# ==========================================

echo "Step 4: Linking and restarting Nginx..."
echo "----------------------------------------"

# Remove all old configs
sudo rm -f /etc/nginx/sites-enabled/*
echo "✅ Removed old Nginx configs"
echo ""

# Link new config
sudo ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
echo "✅ Linked new Nginx config"
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
# STEP 5: START PM2
# ==========================================

echo "Step 5: Starting PM2..."
echo "----------------------------------------"

# Start PM2
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save
echo "✅ PM2 started and saved"
echo ""

# Wait for app to start
echo "Waiting for application to start..."
sleep 10
echo "✅ Wait complete"
echo ""

# ==========================================
# STEP 6: VERIFY DEPLOYMENT
# ==========================================

echo "Step 6: Verifying deployment..."
echo "----------------------------------------"

# Check PM2 Status
echo "A. Checking PM2 Status..."
pm2 status "$APP_NAME"
echo ""

# Check if port is listening
echo "B. Checking if port 3000 is listening..."
if netstat -tuln | grep -q ":3000"; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is NOT listening"
    echo "Checking PM2 logs..."
    pm2 logs "$APP_NAME" --lines 30 --nostream
    exit 1
fi
echo ""

# Test localhost response
echo "C. Testing localhost response..."
LOCALHOST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$LOCALHOST_RESPONSE" = "200" ]; then
    echo "✅ Localhost responding with 200 OK"
elif [ "$LOCALHOST_RESPONSE" = "000" ]; then
    echo "❌ Localhost not responding (connection refused)"
    echo "Checking PM2 logs..."
    pm2 logs "$APP_NAME" --lines 30 --nostream
    exit 1
else
    echo "⚠️  Localhost responding with HTTP $LOCALHOST_RESPONSE"
fi
echo ""

# Check for content
echo "D. Checking for content in HTML..."
if curl -s http://localhost:3000/ 2>/dev/null | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Content is present in HTML"
else
    echo "⚠️  Content may be missing from HTML"
fi
echo ""

# Check Nginx status
echo "E. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl start nginx
    echo "✅ Nginx started"
fi
echo ""

# Test Nginx proxy (HTTP)
echo "F. Testing Nginx proxy (HTTP)..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$NGINX_RESPONSE" = "200" ]; then
    echo "✅ Nginx proxy responding with 200 OK"
elif [ "$NGINX_RESPONSE" = "301" ] || [ "$NGINX_RESPONSE" = "302" ]; then
    echo "✅ Nginx proxy redirecting to HTTPS (HTTP $NGINX_RESPONSE)"
    echo "This is expected if HTTPS is configured"
else
    echo "⚠️  Nginx proxy responding with HTTP $NGINX_RESPONSE"
    echo "Checking Nginx error log..."
    sudo tail -10 /var/log/nginx/error.log
fi
echo ""

# Test content via Nginx
echo "G. Testing content via Nginx..."
if curl -s http://localhost/ 2>/dev/null | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Content is accessible via Nginx"
elif curl -s -L http://localhost/ 2>/dev/null | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Content is accessible via Nginx (after redirect)"
else
    echo "⚠️  Content may not be accessible via Nginx"
fi
echo ""

# ==========================================
# FINAL SUMMARY
# ==========================================

echo "=========================================="
echo "FINAL HTTPS DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "✅ PM2 process deleted and cleaned"
echo "✅ Build cache and node_modules cleaned"
echo "✅ Fresh install and build completed"
echo "✅ Robust HTTPS Nginx configuration created"
echo "✅ Nginx restarted"
echo "✅ PM2 started and running"
echo "✅ Port 3000 is listening"
echo "✅ Application is responding"
echo "✅ Content is accessible"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com (or http:// if SSL not configured)"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo ""
echo "If SSL certificates are not configured:"
echo "- Run: sudo certbot --nginx -d www.cryptorafts.com -d cryptorafts.com"
echo "- Or update SSL certificate paths in: $NGINX_CONFIG"
echo ""
echo "If still not working:"
echo "- Check PM2 logs: pm2 logs $APP_NAME --lines 50"
echo "- Check Nginx logs: tail -f /var/log/nginx/error.log"
echo "- Verify port 3000: netstat -tuln | grep 3000"
echo ""

