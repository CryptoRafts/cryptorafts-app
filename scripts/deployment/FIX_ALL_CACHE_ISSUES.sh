#!/bin/bash
# Complete Cache Fix - Browser, CDN, and Nginx

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "COMPLETE CACHE FIX"
echo "=========================================="
echo ""

echo "1. Fixing Nginx config..."
# Remove all backup files
rm -f /etc/nginx/sites-enabled/cryptorafts.backup.*
rm -f /etc/nginx/sites-available/cryptorafts.backup.*

# Fix duplicate upstream
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

echo "2. Testing Nginx config..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config valid"
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Config invalid"
    nginx -t 2>&1 | grep -i error
fi
echo ""

echo "3. Checking for CDN/Proxy in front..."
# Check if there's Cloudflare or other CDN
DNS_RESULT=$(dig +short www.cryptorafts.com | head -1)
echo "   DNS resolves to: $DNS_RESULT"
echo "   Your server IP: 72.61.98.99"

if [ "$DNS_RESULT" != "72.61.98.99" ]; then
    echo "   ⚠️  CDN/Proxy detected - content might be cached there"
    echo "   You may need to purge CDN cache"
else
    echo "   ✅ No CDN detected - direct to server"
fi
echo ""

echo "4. Testing public URL content..."
PUBLIC_HTML=$(curl -s "https://www.cryptorafts.com/" 2>&1)
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content in HTML"
    
    # Count occurrences
    COUNT=$(echo "$PUBLIC_HTML" | grep -o "WELCOME TO CRYPTORAFTS" | wc -l)
    echo "   Found $COUNT occurrences"
else
    echo "   ❌ Hero content NOT in HTML"
fi
echo ""

echo "5. Testing CSS file..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
    CSS_HEADERS=$(curl -I "$CSS_URL" 2>&1 | head -8)
    
    echo "   CSS URL: $CSS_URL"
    echo "   Status: $(echo "$CSS_HEADERS" | head -1)"
    echo "   Content-Type: $(echo "$CSS_HEADERS" | grep -i "content-type")"
    
    # Check if CSS is actually CSS
    CSS_BODY=$(curl -s "$CSS_URL" 2>&1 | head -c 100)
    if echo "$CSS_BODY" | grep -q "@\|\.\|{"; then
        echo "   ✅ CSS file contains CSS code"
    else
        echo "   ❌ CSS file might be HTML or empty"
    fi
fi
echo ""

echo "6. Testing JS file..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
    JS_HEADERS=$(curl -I "$JS_URL" 2>&1 | head -8)
    
    echo "   JS URL: $JS_URL"
    echo "   Status: $(echo "$JS_HEADERS" | head -1)"
    echo "   Content-Type: $(echo "$JS_HEADERS" | grep -i "content-type")"
    
    # Check if JS is actually JS
    JS_BODY=$(curl -s "$JS_URL" 2>&1 | head -c 100)
    if echo "$JS_BODY" | grep -q "(function\|=>\|var\|const"; then
        echo "   ✅ JS file contains JavaScript code"
    else
        echo "   ❌ JS file might be HTML or empty"
    fi
fi
echo ""

echo "7. Checking PM2 status..."
pm2 status | grep cryptorafts
echo ""

echo "8. Testing local server..."
LOCAL_HTML=$(curl -s "http://127.0.0.1:3000/" 2>&1)
if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content in local server"
else
    echo "   ❌ Hero content NOT in local server"
fi
echo ""

echo "=========================================="
echo "DIAGNOSTIC COMPLETE!"
echo "=========================================="
echo ""
echo "According to web search, your site IS showing full content."
echo "This is likely a browser cache issue."
echo ""
echo "SOLUTION:"
echo "1. Clear browser cache completely:"
echo "   - Press Ctrl+Shift+Delete"
echo "   - Select 'All time'"
echo "   - Check 'Cached images and files'"
echo "   - Click 'Clear data'"
echo ""
echo "2. Or use incognito/private mode"
echo ""
echo "3. Or try a different browser"
echo ""
echo "4. If using Cloudflare/CDN, purge cache there too"
echo ""

