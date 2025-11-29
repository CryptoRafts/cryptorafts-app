#!/bin/bash

# ==========================================
# FINAL NGINX FIX AND RESTART
# ==========================================
# This script:
# 1. Cleans up old/broken Nginx links
# 2. Creates HTTP-only config file
# 3. Links and restarts Nginx
# 4. Restarts PM2
# NO APP CODE CHANGES
# ==========================================

set -e

APP_NAME="cryptorafts"
APP_DIR="/var/www/cryptorafts"
NGINX_CONFIG="/etc/nginx/sites-available/http-only.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/http-only.conf"

echo "=========================================="
echo "FINAL NGINX FIX AND RESTART"
echo "=========================================="
echo ""

# ==========================================
# STEP 1: CLEAN UP OLD/BROKEN LINKS
# ==========================================

echo "Step 1: Cleaning up old/broken Nginx links..."
echo "----------------------------------------"

sudo rm -f /etc/nginx/sites-enabled/default
echo "✅ Removed default Nginx config"

sudo rm -f /etc/nginx/sites-enabled/cryptorafts.com
echo "✅ Removed old cryptorafts config"

echo "✅ Cleanup complete"
echo ""

# ==========================================
# STEP 2: CREATE HTTP-ONLY CONFIG FILE
# ==========================================

echo "Step 2: Creating HTTP-only Nginx configuration file..."
echo "----------------------------------------"

cat << 'EOF' | sudo tee "$NGINX_CONFIG" > /dev/null
server {
    listen 80;
    server_name www.cryptorafts.com cryptorafts.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host; 
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "✅ HTTP-only Nginx config file created"
echo ""

# ==========================================
# STEP 3: LINK AND RESTART NGINX
# ==========================================

echo "Step 3: Linking HTTP-only config and restarting Nginx..."
echo "----------------------------------------"

sudo ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
echo "✅ Linked HTTP-only config"
echo ""

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
# STEP 4: RESTART PM2
# ==========================================

echo "Step 4: Restarting PM2..."
echo "----------------------------------------"

cd "$APP_DIR" || exit 1
echo "✅ Working directory: $(pwd)"
echo ""

pm2 stop "$APP_NAME" 2>/dev/null || echo "⚠️  PM2 process not running"
echo "✅ PM2 stopped"
echo ""

pm2 restart "$APP_NAME" 2>/dev/null || pm2 start npm --name "$APP_NAME" -- start
echo "✅ PM2 restarted"
echo ""

pm2 save
echo "✅ PM2 saved"
echo ""

# Wait for app to start
echo "Waiting for application to start..."
sleep 5
echo "✅ Wait complete"
echo ""

# ==========================================
# STEP 5: VERIFICATION
# ==========================================

echo "Step 5: Verification..."
echo "----------------------------------------"

echo "A. Checking PM2 Status..."
pm2 status "$APP_NAME"
echo ""

echo "B. Checking if port 3000 is listening..."
if netstat -tuln | grep -q ":3000"; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is NOT listening"
fi
echo ""

echo "C. Testing localhost response..."
LOCALHOST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$LOCALHOST_RESPONSE" = "200" ]; then
    echo "✅ Localhost responding with 200 OK"
elif [ "$LOCALHOST_RESPONSE" = "000" ]; then
    echo "❌ Localhost not responding (connection refused)"
    echo "Checking PM2 logs..."
    pm2 logs "$APP_NAME" --lines 20 --nostream
else
    echo "⚠️  Localhost responding with HTTP $LOCALHOST_RESPONSE"
fi
echo ""

echo "D. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl start nginx
    echo "✅ Nginx started"
fi
echo ""

echo "E. Testing Nginx proxy..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$NGINX_RESPONSE" = "200" ]; then
    echo "✅ Nginx proxy responding with 200 OK"
else
    echo "⚠️  Nginx proxy responding with HTTP $NGINX_RESPONSE"
fi
echo ""

# ==========================================
# FINAL SUMMARY
# ==========================================

echo "=========================================="
echo "FINAL NGINX FIX AND RESTART COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration fixed and restarted"
echo "✅ PM2 restarted"
echo ""
echo "Next steps:"
echo "1. Open a new Incognito Window (Ctrl + Shift + N)"
echo "2. Manually type: http://www.cryptorafts.com"
echo "3. Clear browser cache if needed"
echo ""
echo "If still not working, check Nginx error log:"
echo "  tail -f /var/log/nginx/error.log"
echo ""

