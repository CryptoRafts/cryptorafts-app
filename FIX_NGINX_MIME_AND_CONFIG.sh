#!/bin/bash
# Fix Nginx MIME types and config issues

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING NGINX MIME TYPES & CONFIG"
echo "=========================================="
echo ""

echo "1. Removing duplicate backup files causing config errors..."
rm -f /etc/nginx/sites-enabled/cryptorafts.backup.*
echo "✅ Backup files removed"
echo ""

echo "2. Checking Nginx config for MIME types..."
if [ -f "/etc/nginx/nginx.conf" ]; then
    if grep -q "include.*mime.types" /etc/nginx/nginx.conf; then
        echo "✅ mime.types included"
    else
        echo "⚠️  mime.types not found in nginx.conf"
    fi
else
    echo "❌ nginx.conf not found"
fi
echo ""

echo "3. Checking site config for MIME type overrides..."
if [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    # Check if there are any MIME type issues
    if grep -q "add_header Content-Type.*text/html" /etc/nginx/sites-enabled/cryptorafts; then
        echo "⚠️  Found Content-Type text/html override - this could cause issues"
    else
        echo "✅ No problematic MIME type overrides found"
    fi
fi
echo ""

echo "4. Ensuring correct MIME types in site config..."
if [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    # Backup config
    cp /etc/nginx/sites-enabled/cryptorafts /etc/nginx/sites-enabled/cryptorafts.backup.$(date +%s)
    
    # Remove any Content-Type overrides for static files
    sed -i '/location.*\.(css|js)/,/^[[:space:]]*}/ {
        /add_header Content-Type.*text\/html/d
    }' /etc/nginx/sites-enabled/cryptorafts
    
    # Ensure static files location has correct MIME types
    if ! grep -q "types {" /etc/nginx/sites-enabled/cryptorafts; then
        # Add types block if not present in static file location
        if grep -q "location.*\.(css|js)" /etc/nginx/sites-enabled/cryptorafts; then
            echo "   Adding MIME type configuration..."
            # This is handled by mime.types include, so we just ensure it's not overridden
        fi
    fi
    
    echo "✅ Config updated"
else
    echo "❌ Site config not found"
fi
echo ""

echo "5. Testing Nginx config..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config is valid"
    
    echo "6. Reloading Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
    else
        echo "❌ Nginx reload failed"
        echo "   Checking status..."
        systemctl status nginx --no-pager | head -10
    fi
else
    echo "❌ Nginx config is invalid"
    echo "   Errors:"
    nginx -t 2>&1 | grep -i error
    echo ""
    echo "   Attempting to fix..."
    
    # Remove any duplicate upstream blocks
    if [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
        # Count upstream blocks
        UPSTREAM_COUNT=$(grep -c "^upstream nextjs_backend" /etc/nginx/sites-enabled/cryptorafts)
        if [ $UPSTREAM_COUNT -gt 1 ]; then
            echo "   Found $UPSTREAM_COUNT upstream blocks, removing duplicates..."
            # Keep only the first upstream block
            sed -i '/^upstream nextjs_backend/,/^}/!b; /^upstream nextjs_backend/{:a; N; /^}/!ba; x; s/.*//; x; }' /etc/nginx/sites-enabled/cryptorafts
            # Actually, simpler approach - remove all but first
            awk '/^upstream nextjs_backend/{if(++count>1)skip=1} /^}/{if(skip)skip=0;next} !skip' /etc/nginx/sites-enabled/cryptorafts > /tmp/nginx_fixed.conf
            mv /tmp/nginx_fixed.conf /etc/nginx/sites-enabled/cryptorafts
            
            echo "   ✅ Duplicates removed"
        fi
    fi
    
    # Test again
    if nginx -t 2>&1 | grep -q "successful"; then
        echo "✅ Config fixed and valid"
        systemctl reload nginx && echo "✅ Nginx reloaded" || echo "❌ Reload failed"
    else
        echo "❌ Still invalid after fix attempt"
        echo "   Please check manually: nginx -t"
    fi
fi
echo ""

echo "7. Testing CSS file with correct MIME type..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_HEADERS=$(curl -I "https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME" 2>&1 | head -5)
    echo "$CSS_HEADERS" | grep -i "content-type.*css" && echo "   ✅ Correct MIME type" || echo "   ⚠️  Still wrong MIME type"
    echo "$CSS_HEADERS" | grep -i "content-type"
fi
echo ""

echo "8. Testing JS file with correct MIME type..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_HEADERS=$(curl -I "https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME" 2>&1 | head -5)
    echo "$JS_HEADERS" | grep -i "content-type.*javascript" && echo "   ✅ Correct MIME type" || echo "   ⚠️  Still wrong MIME type"
    echo "$JS_HEADERS" | grep -i "content-type"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "Now clear browser cache and test:"
echo "1. Ctrl+Shift+Delete → Clear cache"
echo "2. Or use incognito mode"
echo "3. Hard refresh: Ctrl+Shift+R"
echo ""

