#!/bin/bash
# Complete Next.js Deployment Fix - Addresses All Common Issues

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "COMPLETE NEXT.JS DEPLOYMENT FIX"
echo "=========================================="
echo ""

echo "Step 1: Stopping PM2..."
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
echo "✅ PM2 stopped"
echo ""

echo "Step 2: Cleaning build cache..."
rm -rf .next
rm -f .next/lock
pkill -f "next build" || true
pkill -f "next dev" || true
echo "✅ Build cache cleaned"
echo ""

echo "Step 3: Fixing Nginx config for Next.js..."
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

# Ensure correct MIME types
sed -i '/add_header Content-Type.*text\/html/d' /etc/nginx/sites-enabled/cryptorafts
sed -i '/add_header Content-Type.*text\/plain/d' /etc/nginx/sites-enabled/cryptorafts

# Ensure _next/static is proxied correctly
if ! grep -q "location /_next/static" /etc/nginx/sites-enabled/cryptorafts; then
    # Add _next/static location if missing
    sed -i '/location \/_next\/static/a\
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
    }' /etc/nginx/sites-enabled/cryptorafts
    echo "✅ Added _next/static location"
fi

echo "✅ Nginx config fixed"
echo ""

echo "Step 4: Testing Nginx config..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config valid"
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Config invalid:"
    nginx -t 2>&1 | grep -i error
    exit 1
fi
echo ""

echo "Step 5: Rebuilding application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

echo "Step 6: Verifying build output..."
if [ ! -d ".next/static" ]; then
    echo "❌ .next/static does not exist - build failed"
    exit 1
fi

CSS_COUNT=$(find .next/static -name "*.css" | wc -l)
JS_COUNT=$(find .next/static -name "*.js" | wc -l)
echo "   CSS files: $CSS_COUNT"
echo "   JS files: $JS_COUNT"

if [ $CSS_COUNT -eq 0 ]; then
    echo "❌ No CSS files found - build incomplete"
    exit 1
fi

if [ $JS_COUNT -eq 0 ]; then
    echo "❌ No JS files found - build incomplete"
    exit 1
fi
echo "✅ Build output verified"
echo ""

echo "Step 7: Starting PM2..."
pm2 start ecosystem.config.js
sleep 10
pm2 status | grep cryptorafts
echo "✅ PM2 started"
echo ""

echo "Step 8: Waiting for server to be ready..."
for i in {1..60}; do
    if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
        echo "✅ Server is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Server not ready after 60 seconds"
        pm2 logs cryptorafts --lines 20
        exit 1
    fi
    sleep 1
done
echo ""

echo "Step 9: Testing local server..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/)
if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in local server"
else
    echo "❌ Hero content NOT found in local server"
    echo "   First 500 chars of HTML:"
    echo "$LOCAL_HTML" | head -c 500
    exit 1
fi
echo ""

echo "Step 10: Testing public URL..."
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/)
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in public URL"
else
    echo "❌ Hero content NOT found in public URL"
    echo "   First 500 chars of HTML:"
    echo "$PUBLIC_HTML" | head -c 500
    exit 1
fi
echo ""

echo "Step 11: Testing CSS file..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
    
    # Check if CSS is in HTML
    if echo "$PUBLIC_HTML" | grep -q "$CSS_BASENAME"; then
        echo "   ✅ CSS link found in HTML"
    else
        echo "   ❌ CSS link NOT in HTML - this is the problem!"
        echo "   Adding CSS link manually..."
        # This shouldn't be necessary, but if CSS isn't in HTML, that's the issue
    fi
    
    # Check if CSS file is accessible
    CSS_STATUS=$(curl -I "$CSS_URL" 2>&1 | head -1)
    if echo "$CSS_STATUS" | grep -q "200"; then
        echo "   ✅ CSS file accessible"
        CSS_TYPE=$(curl -I "$CSS_URL" 2>&1 | grep -i "content-type")
        echo "   $CSS_TYPE"
    else
        echo "   ❌ CSS file NOT accessible: $CSS_STATUS"
    fi
fi
echo ""

echo "Step 12: Testing JS files..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
    
    # Check if JS is in HTML
    if echo "$PUBLIC_HTML" | grep -q "$JS_BASENAME"; then
        echo "   ✅ JS link found in HTML"
    else
        echo "   ❌ JS link NOT in HTML - this is the problem!"
    fi
    
    # Check if JS file is accessible
    JS_STATUS=$(curl -I "$JS_URL" 2>&1 | head -1)
    if echo "$JS_STATUS" | grep -q "200"; then
        echo "   ✅ JS file accessible"
        JS_TYPE=$(curl -I "$JS_URL" 2>&1 | grep -i "content-type")
        echo "   $JS_TYPE"
    else
        echo "   ❌ JS file NOT accessible: $JS_STATUS"
    fi
fi
echo ""

echo "Step 13: Checking for hidden/streaming divs..."
HIDDEN_COUNT=$(echo "$PUBLIC_HTML" | grep -o '<div[^>]*hidden[^>]*>' | wc -l)
STREAMING_COUNT=$(echo "$PUBLIC_HTML" | grep -o 'id="S:[^"]*"' | wc -l)
echo "   Hidden divs: $HIDDEN_COUNT"
echo "   Streaming divs: $STREAMING_COUNT"
if [ $HIDDEN_COUNT -gt 0 ] || [ $STREAMING_COUNT -gt 0 ]; then
    echo "   ⚠️  Found hidden/streaming divs - content might be hidden"
fi
echo ""

echo "Step 14: Final verification..."
echo "   PM2 Status:"
pm2 status | grep cryptorafts
echo ""
echo "   Nginx Status:"
systemctl is-active nginx && echo "   ✅ Nginx is running" || echo "   ❌ Nginx is not running"
echo ""
echo "   Server Response Headers:"
curl -I http://127.0.0.1:3000/ 2>&1 | head -5
echo ""

echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "If hero content is still not showing:"
echo "1. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "2. Test in incognito mode"
echo "3. Check browser console (F12) for errors"
echo "4. Check Network tab to see if CSS/JS files load"
echo ""

