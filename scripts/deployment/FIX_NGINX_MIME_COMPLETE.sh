#!/bin/bash
# Complete Nginx MIME Type Fix

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "COMPLETE NGINX MIME TYPE FIX"
echo "=========================================="
echo ""

echo "1. Checking current Nginx config..."
if [ ! -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    echo "❌ Config file not found!"
    exit 1
fi

echo "2. Backing up current config..."
cp /etc/nginx/sites-enabled/cryptorafts /etc/nginx/sites-enabled/cryptorafts.backup.$(date +%s)
echo "✅ Backup created"
echo ""

echo "3. Checking for duplicate upstream blocks..."
UPSTREAM_COUNT=$(grep -c "^upstream nextjs_backend" /etc/nginx/sites-enabled/cryptorafts)
if [ $UPSTREAM_COUNT -gt 1 ]; then
    echo "   ⚠️  Multiple upstream blocks - fixing..."
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
    
    NEW_COUNT=$(grep -c "^upstream nextjs_backend" /tmp/nginx_fixed.conf)
    if [ $NEW_COUNT -eq 1 ]; then
        mv /tmp/nginx_fixed.conf /etc/nginx/sites-enabled/cryptorafts
        echo "   ✅ Duplicates removed"
    else
        echo "   ❌ Fix failed"
        rm -f /tmp/nginx_fixed.conf
    fi
else
    echo "   ✅ Only one upstream block"
fi
echo ""

echo "4. Ensuring MIME types are correct..."
# Remove any Content-Type overrides that might be causing issues
sed -i '/location.*_next\/static/,/^[[:space:]]*}/ {
    /add_header Content-Type.*text\/html/d
    /add_header Content-Type.*text\/plain/d
}' /etc/nginx/sites-enabled/cryptorafts

sed -i '/location.*\.(css|js)/,/^[[:space:]]*}/ {
    /add_header Content-Type.*text\/html/d
    /add_header Content-Type.*text\/plain/d
}' /etc/nginx/sites-enabled/cryptorafts

echo "✅ Removed Content-Type overrides"
echo ""

echo "5. Testing Nginx config..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config is valid"
    
    echo "6. Reloading Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded"
    else
        echo "❌ Reload failed"
        systemctl status nginx --no-pager | head -5
    fi
else
    echo "❌ Config invalid"
    nginx -t 2>&1 | grep -i error
    echo ""
    echo "Showing config (first 40 lines):"
    head -40 /etc/nginx/sites-enabled/cryptorafts
fi
echo ""

echo "7. Testing CSS MIME type..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_HEADERS=$(curl -I "https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME" 2>&1 | head -8)
    echo "$CSS_HEADERS"
    if echo "$CSS_HEADERS" | grep -qi "text/css"; then
        echo "   ✅ Correct MIME type"
    else
        echo "   ❌ Wrong MIME type"
        echo "   Next.js should set this - checking if it's being proxied correctly"
    fi
fi
echo ""

echo "8. Testing JS MIME type..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_HEADERS=$(curl -I "https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME" 2>&1 | head -8)
    echo "$JS_HEADERS"
    if echo "$JS_HEADERS" | grep -qi "javascript"; then
        echo "   ✅ Correct MIME type"
    else
        echo "   ❌ Wrong MIME type"
        echo "   Next.js should set this - checking if it's being proxied correctly"
    fi
fi
echo ""

echo "9. Checking if Next.js is setting MIME types..."
LOCAL_CSS=$(curl -I "http://127.0.0.1:3000/_next/static/css/$CSS_BASENAME" 2>&1 | head -5)
echo "   Local CSS headers:"
echo "$LOCAL_CSS" | grep -i "content-type"
if echo "$LOCAL_CSS" | grep -qi "text/css"; then
    echo "   ✅ Next.js sets correct MIME type"
    echo "   ⚠️  Nginx might be overriding it"
else
    echo "   ❌ Next.js not setting MIME type correctly"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "If MIME types are still wrong, Next.js might not be setting them."
echo "The content is in the HTML - clear browser cache and test!"
echo ""

