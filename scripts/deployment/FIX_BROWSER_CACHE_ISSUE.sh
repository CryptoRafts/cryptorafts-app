#!/bin/bash
# Fix Browser Cache and CSS/JS Loading Issues

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING BROWSER CACHE & ASSET LOADING"
echo "=========================================="
echo ""

echo "1. Checking CSS file accessibility..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    echo "   CSS File: $CSS_BASENAME"
    
    # Test local
    echo "   Testing local server..."
    LOCAL_CSS=$(curl -I "http://127.0.0.1:3000/_next/static/css/$CSS_BASENAME" 2>&1 | head -5)
    echo "$LOCAL_CSS" | grep -q "200\|OK" && echo "   ✅ Local CSS accessible" || echo "   ❌ Local CSS NOT accessible"
    
    # Test public
    echo "   Testing public URL..."
    PUBLIC_CSS=$(curl -I "https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME" 2>&1 | head -5)
    echo "$PUBLIC_CSS" | grep -q "200\|OK" && echo "   ✅ Public CSS accessible" || echo "   ❌ Public CSS NOT accessible"
    
    # Check Content-Type
    echo "$PUBLIC_CSS" | grep -i "content-type" | grep -q "text/css\|css" && echo "   ✅ Correct MIME type" || echo "   ⚠️  Wrong MIME type"
    
    # Check cache headers
    echo "$PUBLIC_CSS" | grep -i "cache-control" && echo "   Cache headers found" || echo "   ⚠️  No cache headers"
else
    echo "   ❌ No CSS file found!"
fi
echo ""

echo "2. Checking JS chunks..."
JS_COUNT=$(ls .next/static/chunks/*.js 2>/dev/null | wc -l)
echo "   JS chunks: $JS_COUNT"
if [ $JS_COUNT -gt 0 ]; then
    JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
    JS_BASENAME=$(basename "$JS_FILE")
    echo "   Testing: $JS_BASENAME"
    
    PUBLIC_JS=$(curl -I "https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME" 2>&1 | head -5)
    echo "$PUBLIC_JS" | grep -q "200\|OK" && echo "   ✅ Public JS accessible" || echo "   ❌ Public JS NOT accessible"
    
    echo "$PUBLIC_JS" | grep -i "content-type" | grep -q "javascript\|application/javascript" && echo "   ✅ Correct MIME type" || echo "   ⚠️  Wrong MIME type"
fi
echo ""

echo "3. Checking Nginx cache settings..."
if [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    echo "   Nginx config found"
    grep -q "proxy_cache\|add_header.*Cache-Control" /etc/nginx/sites-enabled/cryptorafts && echo "   ⚠️  Cache headers found in config" || echo "   ✅ No aggressive caching"
else
    echo "   ⚠️  Nginx config not found"
fi
echo ""

echo "4. Adding cache-busting headers to Nginx..."
if [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    # Backup config
    cp /etc/nginx/sites-enabled/cryptorafts /etc/nginx/sites-enabled/cryptorafts.backup.$(date +%s)
    
    # Add no-cache headers for HTML
    if ! grep -q "add_header Cache-Control.*no-cache.*always" /etc/nginx/sites-enabled/cryptorafts; then
        echo "   Adding no-cache headers for HTML..."
        sed -i '/location \/ {/,/^[[:space:]]*}/ {
            /proxy_pass/a\
            add_header Cache-Control "no-cache, no-store, must-revalidate" always;\
            add_header Pragma "no-cache" always;\
            add_header Expires "0" always;
        }' /etc/nginx/sites-enabled/cryptorafts
        echo "   ✅ Headers added"
    else
        echo "   ✅ Headers already present"
    fi
    
    # Test Nginx config
    nginx -t && echo "   ✅ Nginx config valid" || echo "   ❌ Nginx config invalid"
    
    # Reload Nginx
    systemctl reload nginx && echo "   ✅ Nginx reloaded" || echo "   ❌ Nginx reload failed"
else
    echo "   ⚠️  Cannot modify Nginx config (file not found)"
fi
echo ""

echo "5. Checking HTML response headers..."
HTML_HEADERS=$(curl -I "https://www.cryptorafts.com/" 2>&1 | head -10)
echo "$HTML_HEADERS" | grep -i "cache-control" && echo "   Cache-Control headers:" || echo "   ⚠️  No Cache-Control headers"
echo "$HTML_HEADERS" | grep -i "cache-control"
echo ""

echo "6. Verifying hero content in HTML..."
HTML_BODY=$(curl -s "https://www.cryptorafts.com/" 2>&1)
if echo "$HTML_BODY" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content in HTML"
    
    # Check if CSS/JS links are in HTML
    if echo "$HTML_BODY" | grep -q "_next/static/css"; then
        echo "   ✅ CSS link found in HTML"
        CSS_LINK=$(echo "$HTML_BODY" | grep -o "_next/static/css/[^\"]*" | head -1)
        echo "   CSS link: $CSS_LINK"
    else
        echo "   ❌ CSS link NOT found in HTML"
    fi
    
    if echo "$HTML_BODY" | grep -q "_next/static/chunks"; then
        echo "   ✅ JS links found in HTML"
    else
        echo "   ❌ JS links NOT found in HTML"
    fi
else
    echo "   ❌ Hero content NOT in HTML"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "CRITICAL: Clear browser cache now:"
echo "1. Press Ctrl+Shift+Delete"
echo "2. Select 'Cached images and files'"
echo "3. Select 'All time'"
echo "4. Click 'Clear data'"
echo ""
echo "OR use incognito/private mode to test"
echo ""

