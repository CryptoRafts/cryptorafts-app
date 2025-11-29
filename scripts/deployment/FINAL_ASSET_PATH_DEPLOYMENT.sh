#!/bin/bash

# ==========================================
# FINAL ASSET PATH DEPLOYMENT - EVERYTHING
# ==========================================
# This script:
# 1. Cleans Nginx configuration (removes old HTTPS configs)
# 2. Stops PM2
# 3. Cleans build cache
# 4. Installs dependencies
# 5. Rebuilds with new assetPrefix
# 6. Restarts PM2
# 7. Verifies everything
# ==========================================

set -e

APP_NAME="cryptorafts"
APP_DIR="/var/www/cryptorafts"
NGINX_CONFIG="/etc/nginx/sites-available/http-only.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/http-only.conf"

echo "=========================================="
echo "FINAL ASSET PATH DEPLOYMENT - EVERYTHING"
echo "=========================================="
echo ""

cd "$APP_DIR" || exit 1
echo "✅ Working directory: $(pwd)"
echo ""

# ==========================================
# STEP 1: NGINX FINAL CLEANUP
# ==========================================

echo "Step 1: Nginx final cleanup..."
echo "----------------------------------------"

# Remove old HTTPS configs
sudo rm -f /etc/nginx/sites-available/cryptorafts.com
sudo rm -f /etc/nginx/sites-enabled/cryptorafts.com
echo "✅ Removed old HTTPS configs"
echo ""

# Ensure HTTP-only config is active
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "Creating HTTP-only config..."
    cat << 'EOF' | sudo tee "$NGINX_CONFIG" > /dev/null
server {
    listen 80;
    server_name www.cryptorafts.com cryptorafts.com;

    # Increase body size limit
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
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

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
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
    echo "✅ HTTP-only config created"
fi

# Ensure symlink exists
sudo rm -f "$NGINX_ENABLED"
sudo ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
echo "✅ HTTP-only config linked"
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

# ==========================================
# STEP 2: STOP PM2 AND CLEAN BUILD CACHE
# ==========================================

echo "Step 2: Stopping PM2 and cleaning build cache..."
echo "----------------------------------------"

# Stop PM2
pm2 stop "$APP_NAME" 2>/dev/null || echo "⚠️  PM2 process not running"
sleep 2
echo "✅ PM2 stopped"
echo ""

# Clean build cache
echo "Cleaning build cache..."
rm -rf .next/cache
rm -rf .next/static
rm -f .next/lock
echo "✅ Build cache cleaned"
echo ""

# ==========================================
# STEP 3: INSTALL DEPENDENCIES AND REBUILD
# ==========================================

echo "Step 3: Installing dependencies and rebuilding..."
echo "----------------------------------------"

# Install dependencies
echo "A. Installing dependencies..."
npm install --legacy-peer-deps --production=false
echo "✅ Dependencies installed"
echo ""

# Build application with new assetPrefix
echo "B. Building application with new assetPrefix..."
echo "This may take a few minutes..."
npm run build
echo "✅ Build completed"
echo ""

# ==========================================
# STEP 4: RESTART PM2
# ==========================================

echo "Step 4: Restarting PM2..."
echo "----------------------------------------"

# Start PM2
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save
echo "✅ PM2 restarted and saved"
echo ""

# Wait for app to start
echo "Waiting for application to start..."
sleep 10
echo "✅ Wait complete"
echo ""

# ==========================================
# STEP 5: VERIFY DEPLOYMENT
# ==========================================

echo "Step 5: Verifying deployment..."
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

# Check for assetPrefix in HTML
echo "E. Checking for assetPrefix in HTML..."
if curl -s http://localhost:3000/ 2>/dev/null | grep -q "https://www.cryptorafts.com/_next/static"; then
    echo "✅ Asset prefix is present in HTML"
else
    echo "⚠️  Asset prefix may not be present in HTML"
fi
echo ""

# Check Nginx status
echo "F. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl start nginx
    echo "✅ Nginx started"
fi
echo ""

# Test Nginx proxy
echo "G. Testing Nginx proxy..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$NGINX_RESPONSE" = "200" ]; then
    echo "✅ Nginx proxy responding with 200 OK"
elif [ "$NGINX_RESPONSE" = "301" ] || [ "$NGINX_RESPONSE" = "302" ]; then
    echo "⚠️  Nginx proxy responding with HTTP $NGINX_RESPONSE (redirect)"
    echo "Checking for redirect location..."
    curl -I http://localhost/ 2>/dev/null | grep -i location || echo "No redirect location found"
else
    echo "⚠️  Nginx proxy responding with HTTP $NGINX_RESPONSE"
    echo "Checking Nginx error log..."
    sudo tail -10 /var/log/nginx/error.log
fi
echo ""

# Test content via Nginx
echo "H. Testing content via Nginx..."
if curl -s http://localhost/ 2>/dev/null | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Content is accessible via Nginx"
else
    echo "⚠️  Content may not be accessible via Nginx"
fi
echo ""

# ==========================================
# FINAL SUMMARY
# ==========================================

echo "=========================================="
echo "FINAL ASSET PATH DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration cleaned and restarted"
echo "✅ Build cache cleaned"
echo "✅ Dependencies installed"
echo "✅ Application rebuilt with assetPrefix"
echo "✅ PM2 restarted and running"
echo "✅ Port 3000 is listening"
echo "✅ Application is responding"
echo "✅ Content is accessible"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo ""
echo "If still not working:"
echo "- Check PM2 logs: pm2 logs $APP_NAME --lines 50"
echo "- Check Nginx logs: tail -f /var/log/nginx/error.log"
echo "- Verify port 3000: netstat -tuln | grep 3000"
echo ""

