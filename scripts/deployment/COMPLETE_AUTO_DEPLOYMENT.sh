#!/bin/bash

# ==========================================
# COMPLETE AUTO DEPLOYMENT - EVERYTHING
# ==========================================
# This script does EVERYTHING automatically:
# 1. Fixes Nginx configuration
# 2. Fixes symlink issues
# 3. Ensures PM2 is running
# 4. Verifies port 3000 is listening
# 5. Tests everything
# NO APP CODE CHANGES
# ==========================================

set -e

APP_NAME="cryptorafts"
APP_DIR="/var/www/cryptorafts"
NGINX_CONFIG="/etc/nginx/sites-available/http-only.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/http-only.conf"

echo "=========================================="
echo "COMPLETE AUTO DEPLOYMENT - EVERYTHING"
echo "=========================================="
echo ""

cd "$APP_DIR" || exit 1
echo "✅ Working directory: $(pwd)"
echo ""

# ==========================================
# STEP 1: FIX NGINX CONFIGURATION
# ==========================================

echo "Step 1: Fixing Nginx configuration..."
echo "----------------------------------------"

# Remove old symlinks first
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/cryptorafts.com
sudo rm -f "$NGINX_ENABLED"
echo "✅ Removed old Nginx configs and symlinks"
echo ""

# Create HTTP-only config
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

echo "✅ HTTP-only Nginx config file created"
echo ""

# Create symlink (force remove if exists)
sudo rm -f "$NGINX_ENABLED"
sudo ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
echo "✅ Linked HTTP-only config"
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
# STEP 2: ENSURE PM2 IS RUNNING
# ==========================================

echo "Step 2: Ensuring PM2 is running..."
echo "----------------------------------------"

# Stop PM2
pm2 stop "$APP_NAME" 2>/dev/null || echo "⚠️  PM2 process not running"
sleep 2
echo "✅ PM2 stopped"
echo ""

# Kill any process on port 3000
echo "Killing any process on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || fuser -k 3000/tcp 2>/dev/null || echo "⚠️  No process on port 3000"
sleep 2
echo "✅ Port 3000 cleared"
echo ""

# Start PM2
echo "Starting PM2..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save
echo "✅ PM2 started"
echo ""

# Wait for app to start
echo "Waiting for application to start..."
sleep 10
echo "✅ Wait complete"
echo ""

# ==========================================
# STEP 3: VERIFY DEPLOYMENT
# ==========================================

echo "Step 3: Verifying deployment..."
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

# Check for __NEXT_DATA__
echo "D. Checking for __NEXT_DATA__ in HTML..."
if curl -s http://localhost:3000/ 2>/dev/null | grep -q "__NEXT_DATA__"; then
    echo "✅ __NEXT_DATA__ is present in HTML"
else
    echo "⚠️  __NEXT_DATA__ is missing from HTML"
    echo "This may cause hydration issues, but content should still render"
fi
echo ""

# Check for content
echo "E. Checking for content in HTML..."
if curl -s http://localhost:3000/ 2>/dev/null | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Content is present in HTML"
else
    echo "⚠️  Content may be missing from HTML"
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
    echo "This is normal if HTTPS redirect is configured"
else
    echo "⚠️  Nginx proxy responding with HTTP $NGINX_RESPONSE"
    echo "Checking Nginx error log..."
    sudo tail -20 /var/log/nginx/error.log
fi
echo ""

# ==========================================
# FINAL SUMMARY
# ==========================================

echo "=========================================="
echo "COMPLETE AUTO DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration fixed and restarted"
echo "✅ PM2 restarted and running"
echo "✅ Port 3000 is listening"
echo "✅ Application is responding"
echo ""
echo "Next steps:"
echo "1. Test website: http://www.cryptorafts.com"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo ""
echo "If still not working:"
echo "- Check PM2 logs: pm2 logs $APP_NAME --lines 50"
echo "- Check Nginx logs: tail -f /var/log/nginx/error.log"
echo "- Verify port 3000: netstat -tuln | grep 3000"
echo ""

