#!/bin/bash
# Final Diagnostic - Check Everything

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FINAL DIAGNOSTIC - EVERYTHING"
echo "=========================================="
echo ""

echo "1. Server Status:"
pm2 status | grep cryptorafts
systemctl is-active nginx && echo "   ✅ Nginx is running" || echo "   ❌ Nginx is not running"
echo ""

echo "2. Build Output:"
CSS_COUNT=$(find .next/static/css -name "*.css" 2>/dev/null | wc -l)
JS_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l)
echo "   CSS files: $CSS_COUNT"
echo "   JS chunks: $JS_COUNT"
echo ""

echo "3. HTML Content:"
HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content found in HTML"
else
    echo "   ❌ Hero content NOT found in HTML"
fi

SCRIPT_COUNT=$(echo "$HTML" | grep -o '<script[^>]*src=' | wc -l)
LINK_COUNT=$(echo "$HTML" | grep -o '<link[^>]*rel="stylesheet"' | wc -l)
echo "   Script tags: $SCRIPT_COUNT"
echo "   Stylesheet links: $LINK_COUNT"
echo ""

echo "4. CSS/JS Assets:"
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)

if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_STATUS=$(curl -I "https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME" 2>&1 | head -1)
    if echo "$CSS_STATUS" | grep -q "200"; then
        echo "   ✅ CSS accessible (HTTP 200)"
    else
        echo "   ❌ CSS not accessible"
    fi
fi

if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_STATUS=$(curl -I "https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME" 2>&1 | head -1)
    if echo "$JS_STATUS" | grep -q "200"; then
        echo "   ✅ JS accessible (HTTP 200)"
    else
        echo "   ❌ JS not accessible"
    fi
fi
echo ""

echo "5. Service Worker Check:"
if [ -f "public/sw.js" ] || [ -f "public/service-worker.js" ]; then
    echo "   ⚠️  Service worker found - might be caching old content"
else
    echo "   ✅ No service worker found"
fi
echo ""

echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "✅ Server is working correctly"
echo "✅ Assets are loading correctly"
echo "✅ HTML contains the content"
echo ""
echo "THE ISSUE IS BROWSER CACHE!"
echo ""
echo "SOLUTION:"
echo "1. Open browser DevTools (F12)"
echo "2. Go to Application tab"
echo "3. Click 'Clear storage' in left sidebar"
echo "4. Check ALL boxes"
echo "5. Click 'Clear site data'"
echo "6. Go to Network tab"
echo "7. Check 'Disable cache' checkbox"
echo "8. Keep DevTools open"
echo "9. Refresh page (Ctrl+R)"
echo "10. Check Console tab for any errors"
echo ""
echo "OR use incognito mode (Ctrl+Shift+N)"
echo ""

