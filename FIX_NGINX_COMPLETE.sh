#!/bin/bash
# Complete Nginx Fix - Remove duplicates and fix MIME types

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "COMPLETE NGINX FIX"
echo "=========================================="
echo ""

echo "1. Removing all backup files..."
rm -f /etc/nginx/sites-enabled/cryptorafts.backup.*
echo "✅ Backup files removed"
echo ""

echo "2. Checking current Nginx config..."
if [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    echo "✅ Config file found"
    
    # Count upstream blocks
    UPSTREAM_COUNT=$(grep -c "^upstream nextjs_backend" /etc/nginx/sites-enabled/cryptorafts)
    echo "   Upstream blocks found: $UPSTREAM_COUNT"
    
    if [ $UPSTREAM_COUNT -gt 1 ]; then
        echo "   ⚠️  Multiple upstream blocks - fixing..."
        # Keep only the first upstream block
        awk '
        /^upstream nextjs_backend/ {
            if (++count == 1) {
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
        
        # Verify the fix
        NEW_COUNT=$(grep -c "^upstream nextjs_backend" /tmp/nginx_fixed.conf)
        if [ $NEW_COUNT -eq 1 ]; then
            mv /tmp/nginx_fixed.conf /etc/nginx/sites-enabled/cryptorafts
            echo "   ✅ Duplicates removed"
        else
            echo "   ❌ Fix failed, keeping original"
            rm -f /tmp/nginx_fixed.conf
        fi
    else
        echo "   ✅ Only one upstream block"
    fi
else
    echo "❌ Config file not found"
    exit 1
fi
echo ""

echo "3. Ensuring MIME types are correct..."
if [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    # Check if static files location has correct MIME type handling
    if grep -q "location.*_next/static" /etc/nginx/sites-enabled/cryptorafts; then
        echo "   ✅ _next/static location found"
        
        # Ensure no Content-Type override for static files
        sed -i '/location.*_next\/static/,/^[[:space:]]*}/ {
            /add_header Content-Type.*text\/html/d
            /add_header Content-Type.*text\/plain/d
        }' /etc/nginx/sites-enabled/cryptorafts
        
        echo "   ✅ Removed Content-Type overrides"
    else
        echo "   ⚠️  _next/static location not found"
    fi
    
    # Check for static file extensions location
    if grep -q "location.*\.(css|js)" /etc/nginx/sites-enabled/cryptorafts; then
        echo "   ✅ CSS/JS location found"
        
        # Remove any Content-Type overrides
        sed -i '/location.*\.(css|js)/,/^[[:space:]]*}/ {
            /add_header Content-Type.*text\/html/d
            /add_header Content-Type.*text\/plain/d
        }' /etc/nginx/sites-enabled/cryptorafts
        
        echo "   ✅ Removed Content-Type overrides for CSS/JS"
    fi
else
    echo "❌ Config file not found"
fi
echo ""

echo "4. Testing Nginx config..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config is valid"
    
    echo "5. Reloading Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
    else
        echo "❌ Nginx reload failed"
        systemctl status nginx --no-pager | head -10
    fi
else
    echo "❌ Nginx config is still invalid"
    echo "   Errors:"
    nginx -t 2>&1 | grep -i error
    echo ""
    echo "   Showing config file (first 50 lines):"
    head -50 /etc/nginx/sites-enabled/cryptorafts
    echo ""
    echo "   Please check the config manually"
fi
echo ""

echo "6. Testing CSS MIME type..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_HEADERS=$(curl -I "https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME" 2>&1)
    echo "$CSS_HEADERS" | grep -i "content-type"
    if echo "$CSS_HEADERS" | grep -qi "text/css\|application/css"; then
        echo "   ✅ Correct MIME type for CSS"
    else
        echo "   ❌ Wrong MIME type for CSS"
    fi
fi
echo ""

echo "7. Testing JS MIME type..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_HEADERS=$(curl -I "https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME" 2>&1)
    echo "$JS_HEADERS" | grep -i "content-type"
    if echo "$JS_HEADERS" | grep -qi "javascript\|application/javascript"; then
        echo "   ✅ Correct MIME type for JS"
    else
        echo "   ❌ Wrong MIME type for JS"
    fi
fi
echo ""

echo "8. Verifying hero content in HTML..."
HTML_BODY=$(curl -s "https://www.cryptorafts.com/" 2>&1)
if echo "$HTML_BODY" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content in HTML"
    
    # Check if CSS link is correct
    CSS_LINK=$(echo "$HTML_BODY" | grep -o "_next/static/css/[^\"]*" | head -1)
    if [ -n "$CSS_LINK" ]; then
        echo "   CSS link: $CSS_LINK"
        # Test if CSS link is accessible
        CSS_URL="https://www.cryptorafts.com/$CSS_LINK"
        CSS_TEST=$(curl -I "$CSS_URL" 2>&1 | head -3)
        echo "$CSS_TEST" | grep -q "200\|OK" && echo "   ✅ CSS link accessible" || echo "   ❌ CSS link NOT accessible"
    fi
else
    echo "   ❌ Hero content NOT in HTML"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "If MIME types are still wrong, the issue is in Nginx config."
echo "Check: cat /etc/nginx/sites-enabled/cryptorafts"
echo ""
echo "Clear browser cache and test again!"
echo ""

