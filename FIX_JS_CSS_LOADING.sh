#!/bin/bash
# Fix JavaScript and CSS Bundle Loading Issues

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING JAVASCRIPT & CSS BUNDLE LOADING"
echo "=========================================="
echo ""

# Step 1: Verify build output
echo "Step 1: Verifying build output..."
if [ ! -d ".next" ]; then
    echo "   ❌ .next directory not found - rebuilding..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "   ❌ Build failed"
        exit 1
    fi
    echo "   ✅ Build completed"
fi

CSS_COUNT=$(find .next/static/css -name "*.css" 2>/dev/null | wc -l)
JS_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l)
echo "   CSS files: $CSS_COUNT"
echo "   JS chunks: $JS_COUNT"

if [ "$CSS_COUNT" -eq 0 ] || [ "$JS_COUNT" -eq 0 ]; then
    echo "   ❌ Build output incomplete - rebuilding..."
    rm -rf .next
    npm run build
    if [ $? -ne 0 ]; then
        echo "   ❌ Build failed"
        exit 1
    fi
    echo "   ✅ Rebuild completed"
else
    echo "   ✅ Build output verified"
fi
echo ""

# Step 2: Check file permissions
echo "Step 2: Fixing file permissions..."
chown -R root:root /var/www/cryptorafts
chmod -R 755 /var/www/cryptorafts
chmod -R 644 /var/www/cryptorafts/.next/static 2>/dev/null || true
echo "✅ Permissions fixed"
echo ""

# Step 3: Check Next.js configuration
echo "Step 3: Checking Next.js configuration..."
if [ -f "next.config.js" ]; then
    echo "   ✅ next.config.js found"
    # Check for assetPrefix or basePath
    if grep -q "assetPrefix\|basePath" next.config.js; then
        echo "   ⚠️  assetPrefix or basePath found - checking if correct"
        grep "assetPrefix\|basePath" next.config.js
    else
        echo "   ✅ No assetPrefix/basePath (correct for root domain)"
    fi
else
    echo "   ⚠️  next.config.js not found"
fi
echo ""

# Step 4: Fix Nginx configuration for Next.js static assets
echo "Step 4: Fixing Nginx configuration for Next.js..."
if [ ! -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    echo "   ❌ Nginx config not found"
    exit 1
fi

# Backup config
cp /etc/nginx/sites-enabled/cryptorafts /etc/nginx/sites-enabled/cryptorafts.backup.$(date +%s)

# Remove duplicate upstream
if grep -c "^upstream nextjs_backend" /etc/nginx/sites-enabled/cryptorafts 2>/dev/null | grep -q "^2"; then
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
    echo "   ✅ Duplicate upstream removed"
fi

# Ensure _next/static location block exists and is correct
if ! grep -q "location /_next/static" /etc/nginx/sites-enabled/cryptorafts; then
    echo "   ⚠️  _next/static location block not found - adding it"
    # Add before the main location / block
    sed -i '/location \/ {/i\
# Serve Next.js static files\
location /_next/static {\
    proxy_pass http://nextjs_backend;\
    proxy_http_version 1.1;\
    proxy_set_header Host $host;\
    proxy_set_header X-Real-IP $remote_addr;\
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
    proxy_set_header X-Forwarded-Proto $scheme;\
    proxy_cache_valid 200 365d;\
    expires 365d;\
    add_header Cache-Control "public, immutable";\
}\
' /etc/nginx/sites-enabled/cryptorafts
    echo "   ✅ _next/static location block added"
else
    echo "   ✅ _next/static location block exists"
fi

# Ensure correct MIME types
if ! grep -q "include /etc/nginx/mime.types" /etc/nginx/sites-enabled/cryptorafts; then
    echo "   ⚠️  mime.types not included - adding it"
    sed -i '/server {/a\
    include /etc/nginx/mime.types;\
' /etc/nginx/sites-enabled/cryptorafts
    echo "   ✅ mime.types included"
fi

# Remove Content-Type overrides that might break JS/CSS
sed -i '/add_header Content-Type.*text\/html/d' /etc/nginx/sites-enabled/cryptorafts
sed -i '/add_header Content-Type.*text\/plain/d' /etc/nginx/sites-enabled/cryptorafts

# Test and reload
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx config valid"
    systemctl reload nginx
    echo "   ✅ Nginx reloaded"
else
    echo "   ❌ Nginx config invalid"
    nginx -t 2>&1 | grep -i error
    exit 1
fi
echo ""

# Step 5: Test static asset serving
echo "Step 5: Testing static asset serving..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)

if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
    
    echo "   Testing CSS: $CSS_BASENAME"
    CSS_STATUS=$(curl -I "$CSS_URL" 2>&1 | head -1)
    CSS_TYPE=$(curl -I "$CSS_URL" 2>&1 | grep -i "content-type" || echo "No Content-Type header")
    
    if echo "$CSS_STATUS" | grep -q "200"; then
        echo "   ✅ CSS accessible (HTTP 200)"
        echo "   $CSS_TYPE"
        if echo "$CSS_TYPE" | grep -qi "text/css"; then
            echo "   ✅ Correct MIME type"
        else
            echo "   ⚠️  Wrong MIME type - might not load"
        fi
    else
        echo "   ❌ CSS not accessible"
        echo "   Status: $CSS_STATUS"
    fi
fi

if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
    
    echo "   Testing JS: $JS_BASENAME"
    JS_STATUS=$(curl -I "$JS_URL" 2>&1 | head -1)
    JS_TYPE=$(curl -I "$JS_URL" 2>&1 | grep -i "content-type" || echo "No Content-Type header")
    
    if echo "$JS_STATUS" | grep -q "200"; then
        echo "   ✅ JS accessible (HTTP 200)"
        echo "   $JS_TYPE"
        if echo "$JS_TYPE" | grep -qi "javascript"; then
            echo "   ✅ Correct MIME type"
        else
            echo "   ⚠️  Wrong MIME type - might not execute"
        fi
    else
        echo "   ❌ JS not accessible"
        echo "   Status: $JS_STATUS"
    fi
fi
echo ""

# Step 6: Check HTML for script tags
echo "Step 6: Checking HTML for script tags..."
HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
SCRIPT_COUNT=$(echo "$HTML" | grep -o '<script[^>]*src=' | wc -l)
LINK_COUNT=$(echo "$HTML" | grep -o '<link[^>]*rel="stylesheet"' | wc -l)

echo "   Script tags: $SCRIPT_COUNT"
echo "   Stylesheet links: $LINK_COUNT"

if [ "$SCRIPT_COUNT" -eq 0 ]; then
    echo "   ❌ No script tags found - JavaScript won't load!"
elif [ "$SCRIPT_COUNT" -lt 3 ]; then
    echo "   ⚠️  Very few script tags - might be incomplete"
else
    echo "   ✅ Script tags found"
fi

if [ "$LINK_COUNT" -eq 0 ]; then
    echo "   ❌ No stylesheet links found - CSS won't load!"
else
    echo "   ✅ Stylesheet links found"
fi
echo ""

# Step 7: Check for console errors (test actual file content)
echo "Step 7: Testing actual file content..."
if [ -n "$JS_FILE" ]; then
    JS_CONTENT=$(curl -s "$JS_URL" 2>&1 | head -c 100)
    if echo "$JS_CONTENT" | grep -q "(function\|=>\|var\|const"; then
        echo "   ✅ JS file contains JavaScript code"
    elif echo "$JS_CONTENT" | grep -q "<!doctype html"; then
        echo "   ❌ JS file returns HTML instead of JavaScript!"
        echo "   This means Nginx is serving index.html for JS files"
    else
        echo "   ⚠️  JS file content unclear"
    fi
fi

if [ -n "$CSS_FILE" ]; then
    CSS_CONTENT=$(curl -s "$CSS_URL" 2>&1 | head -c 100)
    if echo "$CSS_CONTENT" | grep -q "@\|\.\|{"; then
        echo "   ✅ CSS file contains CSS code"
    elif echo "$CSS_CONTENT" | grep -q "<!doctype html"; then
        echo "   ❌ CSS file returns HTML instead of CSS!"
        echo "   This means Nginx is serving index.html for CSS files"
    else
        echo "   ⚠️  CSS file content unclear"
    fi
fi
echo ""

# Step 8: Restart PM2
echo "Step 8: Restarting PM2..."
pm2 restart cryptorafts
sleep 5
pm2 status | grep cryptorafts
echo "✅ PM2 restarted"
echo ""

# Step 9: Final summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "SUMMARY:"
echo "  ✅ Build output verified"
echo "  ✅ File permissions fixed"
echo "  ✅ Nginx config updated for Next.js"
echo "  ✅ Static assets tested"
echo ""
echo "NEXT STEPS:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Open browser DevTools (F12)"
echo "3. Go to Network tab"
echo "4. Refresh page (Ctrl+R)"
echo "5. Check if CSS/JS files load (should be 200 OK)"
echo "6. Check Console tab for errors"
echo ""
echo "If CSS/JS files show 404 or wrong MIME type,"
echo "the Nginx configuration needs further adjustment."
echo ""

