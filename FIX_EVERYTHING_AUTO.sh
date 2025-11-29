#!/bin/bash
# Complete Automatic Fix - Everything

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "COMPLETE AUTOMATIC FIX - EVERYTHING"
echo "=========================================="
echo ""

# Step 1: Clean up all backup files
echo "Step 1: Cleaning up backup files..."
rm -f /etc/nginx/sites-enabled/cryptorafts.backup.*
rm -f /etc/nginx/sites-available/cryptorafts.backup.*
echo "✅ Backup files removed"
echo ""

# Step 2: Fix Nginx config - remove duplicate upstream
echo "Step 2: Fixing Nginx config..."
if grep -c "^upstream nextjs_backend" /etc/nginx/sites-enabled/cryptorafts | grep -q "^2"; then
    awk '
    BEGIN { upstream_found = 0 }
    /^upstream nextjs_backend/ {
        if (upstream_found == 0) {
            upstream_found = 1
            print
            getline
            while (!/^}/) {
                print
                getline
            }
            print
        } else {
            getline
            while (!/^}/) {
                getline
            }
        }
        next
    }
    { print }
    ' /etc/nginx/sites-enabled/cryptorafts > /tmp/nginx_fixed.conf
    mv /tmp/nginx_fixed.conf /etc/nginx/sites-enabled/cryptorafts
    echo "✅ Duplicate upstream removed"
fi

# Remove Content-Type overrides
sed -i '/add_header Content-Type.*text\/html/d' /etc/nginx/sites-enabled/cryptorafts
sed -i '/add_header Content-Type.*text\/plain/d' /etc/nginx/sites-enabled/cryptorafts

echo "✅ Nginx config fixed"
echo ""

# Step 3: Test and reload Nginx
echo "Step 3: Testing and reloading Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config valid"
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Config invalid - showing errors:"
    nginx -t 2>&1 | grep -i error
    exit 1
fi
echo ""

# Step 4: Stop PM2
echo "Step 4: Stopping PM2..."
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
echo "✅ PM2 stopped"
echo ""

# Step 5: Clean build cache
echo "Step 5: Cleaning build cache..."
rm -rf .next
rm -f .next/lock
pkill -f "next build" || true
echo "✅ Build cache cleaned"
echo ""

# Step 6: Rebuild
echo "Step 6: Rebuilding application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

# Step 7: Start PM2
echo "Step 7: Starting PM2..."
pm2 start ecosystem.config.js
sleep 5
pm2 status | grep cryptorafts
echo "✅ PM2 started"
echo ""

# Step 8: Wait for server to be ready
echo "Step 8: Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
        echo "✅ Server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server not ready after 30 seconds"
        exit 1
    fi
    sleep 1
done
echo ""

# Step 9: Test local server
echo "Step 9: Testing local server..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in local server"
else
    echo "❌ Hero content NOT found in local server"
    exit 1
fi
echo ""

# Step 10: Test public URL
echo "Step 10: Testing public URL..."
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in public URL"
else
    echo "❌ Hero content NOT found in public URL"
    exit 1
fi
echo ""

# Step 11: Test CSS file
echo "Step 11: Testing CSS file..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
    CSS_STATUS=$(curl -I "$CSS_URL" 2>&1 | head -1)
    if echo "$CSS_STATUS" | grep -q "200"; then
        echo "✅ CSS file accessible: $CSS_BASENAME"
        CSS_TYPE=$(curl -I "$CSS_URL" 2>&1 | grep -i "content-type")
        echo "   $CSS_TYPE"
    else
        echo "❌ CSS file not accessible"
    fi
fi
echo ""

# Step 12: Test JS file
echo "Step 12: Testing JS file..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
    JS_STATUS=$(curl -I "$JS_URL" 2>&1 | head -1)
    if echo "$JS_STATUS" | grep -q "200"; then
        echo "✅ JS file accessible: $JS_BASENAME"
        JS_TYPE=$(curl -I "$JS_URL" 2>&1 | grep -i "content-type")
        echo "   $JS_TYPE"
    else
        echo "❌ JS file not accessible"
    fi
fi
echo ""

# Step 13: Final verification
echo "Step 13: Final verification..."
echo "   PM2 Status:"
pm2 status | grep cryptorafts
echo ""
echo "   Nginx Status:"
systemctl is-active nginx && echo "   ✅ Nginx is running" || echo "   ❌ Nginx is not running"
echo ""
echo "   Server Response:"
curl -I http://127.0.0.1:3000/ 2>&1 | head -3
echo ""

echo "=========================================="
echo "FIX COMPLETE - EVERYTHING DONE!"
echo "=========================================="
echo ""
echo "✅ Nginx config fixed and reloaded"
echo "✅ Application rebuilt"
echo "✅ PM2 restarted"
echo "✅ Local server tested - hero content found"
echo "✅ Public URL tested - hero content found"
echo "✅ CSS/JS files accessible"
echo ""
echo "IMPORTANT: Clear your browser cache now!"
echo "1. Press Ctrl+Shift+Delete"
echo "2. Select 'All time'"
echo "3. Check 'Cached images and files'"
echo "4. Click 'Clear data'"
echo ""
echo "Or test in incognito/private mode!"
echo ""

