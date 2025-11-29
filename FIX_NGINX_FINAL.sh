#!/bin/bash
# Final Nginx Fix - Remove duplicates and fix MIME types

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FINAL NGINX FIX"
echo "=========================================="
echo ""

echo "1. Removing ALL backup files..."
rm -f /etc/nginx/sites-enabled/cryptorafts.backup.*
rm -f /etc/nginx/sites-available/cryptorafts.backup.*
echo "✅ All backup files removed"
echo ""

echo "2. Checking current config..."
if [ ! -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    echo "❌ Config file not found!"
    exit 1
fi

# Count upstream blocks
UPSTREAM_COUNT=$(grep -c "^upstream nextjs_backend" /etc/nginx/sites-enabled/cryptorafts)
echo "   Upstream blocks: $UPSTREAM_COUNT"

if [ $UPSTREAM_COUNT -gt 1 ]; then
    echo "   ⚠️  Multiple upstream blocks found - fixing..."
    
    # Create fixed config with only first upstream block
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
            # Skip duplicate upstream block
            getline
            while (!/^}/) {
                getline
            }
        }
        next
    }
    { print }
    ' /etc/nginx/sites-enabled/cryptorafts > /tmp/nginx_fixed.conf
    
    # Verify fix
    NEW_COUNT=$(grep -c "^upstream nextjs_backend" /tmp/nginx_fixed.conf)
    if [ $NEW_COUNT -eq 1 ]; then
        cp /etc/nginx/sites-enabled/cryptorafts /etc/nginx/sites-enabled/cryptorafts.backup.$(date +%s)
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

echo "3. Testing Nginx config..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config is valid"
    
    echo "4. Reloading Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded"
    else
        echo "❌ Reload failed"
        systemctl status nginx --no-pager | head -5
    fi
else
    echo "❌ Config still invalid"
    echo "   Errors:"
    nginx -t 2>&1 | grep -i error
    echo ""
    echo "   Showing first 30 lines of config:"
    head -30 /etc/nginx/sites-enabled/cryptorafts
    echo ""
    echo "   Please check manually: nginx -t"
fi
echo ""

echo "5. Testing CSS MIME type..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_HEADERS=$(curl -I "https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME" 2>&1 | head -5)
    echo "$CSS_HEADERS" | grep -i "content-type"
    if echo "$CSS_HEADERS" | grep -qi "text/css"; then
        echo "   ✅ Correct MIME type"
    else
        echo "   ❌ Wrong MIME type - Next.js should set this"
    fi
fi
echo ""

echo "6. Testing JS MIME type..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_HEADERS=$(curl -I "https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME" 2>&1 | head -5)
    echo "$JS_HEADERS" | grep -i "content-type"
    if echo "$JS_HEADERS" | grep -qi "javascript"; then
        echo "   ✅ Correct MIME type"
    else
        echo "   ❌ Wrong MIME type - Next.js should set this"
    fi
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "If MIME types are still wrong, Next.js is setting them."
echo "The issue might be browser cache or CSS not loading."
echo ""
echo "Clear browser cache and test in incognito mode!"
echo ""

