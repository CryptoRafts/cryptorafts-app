#!/bin/bash
# Fix CSS/JS Not Loading - Complete Diagnostic and Fix

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING CSS/JS NOT LOADING"
echo "=========================================="
echo ""

# 1. Check PM2 status
echo "Step 1: Checking PM2 status..."
pm2 status | grep cryptorafts || echo "❌ PM2 not running"
echo ""

# 2. Stop PM2
echo "Step 2: Stopping PM2..."
pm2 stop cryptorafts || true
echo "✅ PM2 stopped"
echo ""

# 3. Clean build cache
echo "Step 3: Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache
echo "✅ Build cache cleaned"
echo ""

# 4. Rebuild
echo "Step 4: Rebuilding application..."
npm run build 2>&1 | tee build.log
BUILD_EXIT_CODE=${PIPESTATUS[0]}
if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build complete"
echo ""

# 5. Verify build output
echo "Step 5: Verifying build output..."
if [ ! -d ".next/static/css" ]; then
    echo "❌ CSS directory not found!"
    exit 1
fi

CSS_FILES=$(ls .next/static/css/*.css 2>/dev/null | wc -l)
if [ "$CSS_FILES" -eq 0 ]; then
    echo "❌ No CSS files found!"
    exit 1
fi
echo "✅ CSS files found: $CSS_FILES"

if [ ! -d ".next/static/chunks" ]; then
    echo "❌ JS chunks directory not found!"
    exit 1
fi

JS_FILES=$(ls .next/static/chunks/*.js 2>/dev/null | wc -l)
if [ "$JS_FILES" -eq 0 ]; then
    echo "❌ No JS files found!"
    exit 1
fi
echo "✅ JS files found: $JS_FILES"
echo ""

# 6. Fix file permissions
echo "Step 6: Fixing file permissions..."
chmod -R 755 .next/static
chown -R root:root .next/static
echo "✅ Permissions fixed"
echo ""

# 7. Start PM2
echo "Step 7: Starting PM2..."
pm2 start cryptorafts
sleep 5
echo "✅ PM2 started"
echo ""

# 8. Wait for server
echo "Step 8: Waiting for server..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
        echo "✅ Server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server not responding after 30 seconds"
        exit 1
    fi
    sleep 1
done
echo ""

# 9. Test CSS accessibility
echo "Step 9: Testing CSS accessibility..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
CSS_BASENAME=$(basename "$CSS_FILE")
CSS_URL="http://127.0.0.1:3000/_next/static/css/$CSS_BASENAME"
CSS_RESPONSE=$(curl -sI "$CSS_URL" 2>&1)
if echo "$CSS_RESPONSE" | grep -q "200"; then
    echo "✅ CSS accessible (HTTP 200)"
    CSS_TYPE=$(echo "$CSS_RESPONSE" | grep -i "content-type" || echo "")
    echo "   $CSS_TYPE"
else
    echo "❌ CSS not accessible"
    echo "$CSS_RESPONSE" | head -3
fi
echo ""

# 10. Test JS accessibility
echo "Step 10: Testing JS accessibility..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
JS_BASENAME=$(basename "$JS_FILE")
JS_URL="http://127.0.0.1:3000/_next/static/chunks/$JS_BASENAME"
JS_RESPONSE=$(curl -sI "$JS_URL" 2>&1)
if echo "$JS_RESPONSE" | grep -q "200"; then
    echo "✅ JS accessible (HTTP 200)"
    JS_TYPE=$(echo "$JS_RESPONSE" | grep -i "content-type" || echo "")
    echo "   $JS_TYPE"
else
    echo "❌ JS not accessible"
    echo "$JS_RESPONSE" | head -3
fi
echo ""

# 11. Check HTML includes CSS/JS
echo "Step 11: Checking HTML includes CSS/JS..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "$CSS_BASENAME"; then
    echo "✅ CSS file referenced in HTML"
else
    echo "❌ CSS file NOT referenced in HTML"
    echo "   Looking for: $CSS_BASENAME"
    echo "   HTML length: $(echo "$LOCAL_HTML" | wc -c) bytes"
fi

if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in HTML"
else
    echo "❌ Hero content NOT found in HTML"
fi
echo ""

# 12. Check Nginx config
echo "Step 12: Checking Nginx config..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config is valid"
else
    echo "❌ Nginx config has errors"
    nginx -t 2>&1 | head -5
fi
echo ""

# 13. Reload Nginx
echo "Step 13: Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# 14. Test public URL
echo "Step 14: Testing public URL..."
sleep 3
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in public URL"
else
    echo "❌ Hero content NOT found in public URL"
fi

if echo "$PUBLIC_HTML" | grep -q "$CSS_BASENAME"; then
    echo "✅ CSS file referenced in public HTML"
else
    echo "❌ CSS file NOT referenced in public HTML"
fi
echo ""

# 15. Test public CSS
echo "Step 15: Testing public CSS..."
PUBLIC_CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
PUBLIC_CSS_RESPONSE=$(curl -sI "$PUBLIC_CSS_URL" 2>&1)
if echo "$PUBLIC_CSS_RESPONSE" | grep -q "200"; then
    echo "✅ Public CSS accessible (HTTP 200)"
else
    echo "❌ Public CSS not accessible"
    echo "$PUBLIC_CSS_RESPONSE" | head -3
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Test in incognito mode (Ctrl+Shift+N)"
echo "3. Check browser console (F12) for errors"
echo "4. Check Network tab to see if CSS/JS are loading"
echo ""

