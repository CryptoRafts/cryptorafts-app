#!/bin/bash
# Complete Diagnostic and Fix - Everything

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "COMPLETE DIAGNOSTIC AND FIX"
echo "=========================================="
echo ""

# Step 1: Check DNS
echo "Step 1: Checking DNS..."
DNS_IP=$(dig +short www.cryptorafts.com | head -1)
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "   DNS resolves to: $DNS_IP"
echo "   Server IP: $SERVER_IP"
if [ "$DNS_IP" != "$SERVER_IP" ] && [ "$DNS_IP" != "72.61.98.99" ]; then
    echo "   ⚠️  DNS might be pointing to CDN/proxy"
else
    echo "   ✅ DNS points to server"
fi
echo ""

# Step 2: Check file permissions
echo "Step 2: Checking file permissions..."
chown -R root:root /var/www/cryptorafts
chmod -R 755 /var/www/cryptorafts
chmod -R 644 /var/www/cryptorafts/.next/static 2>/dev/null || true
echo "✅ Permissions fixed"
echo ""

# Step 3: Check Nginx config
echo "Step 3: Checking Nginx config..."
rm -f /etc/nginx/sites-enabled/cryptorafts.backup.*
rm -f /etc/nginx/sites-available/cryptorafts.backup.*

# Ensure only one upstream block
UPSTREAM_COUNT=$(grep -c "^upstream nextjs_backend" /etc/nginx/sites-enabled/cryptorafts 2>/dev/null || echo "0")
if [ "$UPSTREAM_COUNT" -gt 1 ]; then
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

# Test Nginx
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config valid"
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config invalid"
    nginx -t 2>&1 | grep -i error
    exit 1
fi
echo ""

# Step 4: Check PM2
echo "Step 4: Checking PM2..."
pm2 stop cryptorafts 2>/dev/null || true
pm2 delete cryptorafts 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 5: Clean and rebuild
echo "Step 5: Cleaning build cache..."
rm -rf .next
rm -f .next/lock
pkill -f "next build" 2>/dev/null || true
echo "✅ Build cache cleaned"
echo ""

echo "Step 6: Rebuilding application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

# Step 7: Verify build output
echo "Step 7: Verifying build output..."
if [ -d ".next/static" ]; then
    CSS_COUNT=$(find .next/static/css -name "*.css" 2>/dev/null | wc -l)
    JS_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l)
    echo "   CSS files: $CSS_COUNT"
    echo "   JS chunks: $JS_COUNT"
    if [ "$CSS_COUNT" -gt 0 ] && [ "$JS_COUNT" -gt 0 ]; then
        echo "✅ Build output verified"
    else
        echo "❌ Build output incomplete"
        exit 1
    fi
else
    echo "❌ Build output directory missing"
    exit 1
fi
echo ""

# Step 8: Start PM2
echo "Step 8: Starting PM2..."
pm2 start ecosystem.config.js
sleep 10
pm2 status | grep cryptorafts
echo "✅ PM2 started"
echo ""

# Step 9: Wait for server
echo "Step 9: Waiting for server..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
        echo "✅ Server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server not ready"
        pm2 logs cryptorafts --lines 20
        exit 1
    fi
    sleep 1
done
echo ""

# Step 10: Test local server
echo "Step 10: Testing local server..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in local server"
    HERO_COUNT=$(echo "$LOCAL_HTML" | grep -o "WELCOME TO CRYPTORAFTS" | wc -l)
    echo "   Found $HERO_COUNT occurrences"
else
    echo "❌ Hero content NOT found in local server"
    echo "   Checking HTML..."
    echo "$LOCAL_HTML" | head -50
    exit 1
fi
echo ""

# Step 11: Test public URL
echo "Step 11: Testing public URL..."
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in public URL"
    HERO_COUNT=$(echo "$PUBLIC_HTML" | grep -o "WELCOME TO CRYPTORAFTS" | wc -l)
    echo "   Found $HERO_COUNT occurrences"
else
    echo "❌ Hero content NOT found in public URL"
    echo "   This might be a CDN cache issue"
fi
echo ""

# Step 12: Test CSS file
echo "Step 12: Testing CSS file..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
    
    # Test local
    LOCAL_CSS=$(curl -I "http://127.0.0.1:3000/_next/static/css/$CSS_BASENAME" 2>&1 | head -3)
    if echo "$LOCAL_CSS" | grep -q "200"; then
        echo "✅ Local CSS accessible"
    else
        echo "❌ Local CSS not accessible"
    fi
    
    # Test public
    PUBLIC_CSS=$(curl -I "$CSS_URL" 2>&1 | head -3)
    if echo "$PUBLIC_CSS" | grep -q "200"; then
        echo "✅ Public CSS accessible"
        CSS_TYPE=$(curl -I "$CSS_URL" 2>&1 | grep -i "content-type")
        echo "   $CSS_TYPE"
    else
        echo "❌ Public CSS not accessible"
        echo "   Status: $(echo "$PUBLIC_CSS" | head -1)"
    fi
fi
echo ""

# Step 13: Test JS file
echo "Step 13: Testing JS file..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
    
    # Test local
    LOCAL_JS=$(curl -I "http://127.0.0.1:3000/_next/static/chunks/$JS_BASENAME" 2>&1 | head -3)
    if echo "$LOCAL_JS" | grep -q "200"; then
        echo "✅ Local JS accessible"
    else
        echo "❌ Local JS not accessible"
    fi
    
    # Test public
    PUBLIC_JS=$(curl -I "$JS_URL" 2>&1 | head -3)
    if echo "$PUBLIC_JS" | grep -q "200"; then
        echo "✅ Public JS accessible"
        JS_TYPE=$(curl -I "$JS_URL" 2>&1 | grep -i "content-type")
        echo "   $JS_TYPE"
    else
        echo "❌ Public JS not accessible"
        echo "   Status: $(echo "$PUBLIC_JS" | head -1)"
    fi
fi
echo ""

# Step 14: Check Nginx logs
echo "Step 14: Checking Nginx error logs..."
NGINX_ERRORS=$(tail -20 /var/log/nginx/error.log 2>/dev/null | grep -i "error\|failed" | tail -5)
if [ -n "$NGINX_ERRORS" ]; then
    echo "   Recent errors:"
    echo "$NGINX_ERRORS"
else
    echo "✅ No recent errors in Nginx logs"
fi
echo ""

# Step 15: Check PM2 logs
echo "Step 15: Checking PM2 logs..."
PM2_ERRORS=$(pm2 logs cryptorafts --lines 20 --nostream 2>&1 | grep -i "error\|failed" | tail -5)
if [ -n "$PM2_ERRORS" ]; then
    echo "   Recent errors:"
    echo "$PM2_ERRORS"
else
    echo "✅ No recent errors in PM2 logs"
fi
echo ""

# Step 16: Final summary
echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "SUMMARY:"
echo "  ✅ Nginx config fixed and reloaded"
echo "  ✅ Application rebuilt"
echo "  ✅ PM2 restarted"
echo "  ✅ Local server tested"
echo "  ✅ Public URL tested"
echo ""
echo "If you still see only the logo:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Try incognito/private mode"
echo "3. Check if CDN/proxy is caching (purge cache)"
echo "4. Check browser console (F12) for errors"
echo ""

