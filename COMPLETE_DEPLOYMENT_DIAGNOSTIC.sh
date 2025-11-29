#!/bin/bash
# Complete Deployment Diagnostic - Find the Real Problem

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "COMPLETE DEPLOYMENT DIAGNOSTIC"
echo "=========================================="
echo ""

echo "1. Checking actual HTML being served..."
echo "   Local server HTML (first 500 chars):"
curl -s http://127.0.0.1:3000/ | head -c 500
echo ""
echo ""
echo "   Public URL HTML (first 500 chars):"
curl -s https://www.cryptorafts.com/ | head -c 500
echo ""
echo ""

echo "2. Checking if hero content is in HTML..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/)
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/)

if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Local: Hero content found"
else
    echo "   ❌ Local: Hero content NOT found"
fi

if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Public: Hero content found"
else
    echo "   ❌ Public: Hero content NOT found"
fi
echo ""

echo "3. Checking CSS file..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    echo "   CSS file: $CSS_BASENAME"
    
    # Check if CSS is in HTML
    if echo "$PUBLIC_HTML" | grep -q "$CSS_BASENAME"; then
        echo "   ✅ CSS link found in HTML"
    else
        echo "   ❌ CSS link NOT in HTML"
    fi
    
    # Check if CSS file is accessible
    CSS_STATUS=$(curl -I "https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME" 2>&1 | head -1)
    if echo "$CSS_STATUS" | grep -q "200"; then
        echo "   ✅ CSS file accessible"
        CSS_CONTENT=$(curl -s "https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME" | head -c 200)
        echo "   CSS content (first 200 chars): $CSS_CONTENT"
    else
        echo "   ❌ CSS file NOT accessible: $CSS_STATUS"
    fi
else
    echo "   ❌ No CSS file found"
fi
echo ""

echo "4. Checking JS files..."
JS_FILES=$(ls .next/static/chunks/*.js 2>/dev/null | head -3)
if [ -n "$JS_FILES" ]; then
    echo "   Found JS files:"
    for JS_FILE in $JS_FILES; do
        JS_BASENAME=$(basename "$JS_FILE")
        echo "   - $JS_BASENAME"
        
        # Check if JS is in HTML
        if echo "$PUBLIC_HTML" | grep -q "$JS_BASENAME"; then
            echo "     ✅ JS link found in HTML"
        else
            echo "     ❌ JS link NOT in HTML"
        fi
        
        # Check if JS file is accessible
        JS_STATUS=$(curl -I "https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME" 2>&1 | head -1)
        if echo "$JS_STATUS" | grep -q "200"; then
            echo "     ✅ JS file accessible"
        else
            echo "     ❌ JS file NOT accessible: $JS_STATUS"
        fi
    done
else
    echo "   ❌ No JS files found"
fi
echo ""

echo "5. Checking for hidden divs in HTML..."
HIDDEN_DIVS=$(echo "$PUBLIC_HTML" | grep -o '<div[^>]*hidden[^>]*>' | head -5)
if [ -n "$HIDDEN_DIVS" ]; then
    echo "   ⚠️  Found hidden divs:"
    echo "$HIDDEN_DIVS"
else
    echo "   ✅ No hidden divs found"
fi
echo ""

echo "6. Checking for Next.js streaming divs..."
STREAMING_DIVS=$(echo "$PUBLIC_HTML" | grep -o 'id="S:[^"]*"' | head -5)
if [ -n "$STREAMING_DIVS" ]; then
    echo "   ⚠️  Found streaming divs:"
    echo "$STREAMING_DIVS"
else
    echo "   ✅ No streaming divs found"
fi
echo ""

echo "7. Checking Nginx config..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx config valid"
else
    echo "   ❌ Nginx config invalid:"
    nginx -t 2>&1 | grep -i error
fi
echo ""

echo "8. Checking PM2 status..."
pm2 status | grep cryptorafts
echo ""

echo "9. Checking if server is responding..."
if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
    echo "   ✅ Local server responding"
else
    echo "   ❌ Local server NOT responding"
fi

if curl -s https://www.cryptorafts.com/ > /dev/null 2>&1; then
    echo "   ✅ Public URL responding"
else
    echo "   ❌ Public URL NOT responding"
fi
echo ""

echo "10. Checking DNS/CDN..."
DNS_RESULT=$(dig +short www.cryptorafts.com | head -1)
echo "   DNS resolves to: $DNS_RESULT"
echo "   Server IP: 72.61.98.99"
if [ "$DNS_RESULT" != "72.61.98.99" ]; then
    echo "   ⚠️  CDN/Proxy detected - might be caching old content"
else
    echo "   ✅ Direct to server"
fi
echo ""

echo "11. Checking build output..."
if [ -d ".next" ]; then
    echo "   ✅ .next directory exists"
    if [ -d ".next/static" ]; then
        echo "   ✅ .next/static exists"
        CSS_COUNT=$(find .next/static -name "*.css" | wc -l)
        JS_COUNT=$(find .next/static -name "*.js" | wc -l)
        echo "   CSS files: $CSS_COUNT"
        echo "   JS files: $JS_COUNT"
    else
        echo "   ❌ .next/static does not exist"
    fi
else
    echo "   ❌ .next directory does not exist"
fi
echo ""

echo "12. Checking actual rendered HTML structure..."
echo "   Looking for main content sections..."
if echo "$PUBLIC_HTML" | grep -q '<section.*Hero'; then
    echo "   ✅ Hero section found in HTML"
else
    echo "   ❌ Hero section NOT found in HTML"
fi

if echo "$PUBLIC_HTML" | grep -q '<main'; then
    echo "   ✅ Main tag found in HTML"
else
    echo "   ❌ Main tag NOT found in HTML"
fi
echo ""

echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""

