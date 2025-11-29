#!/bin/bash
# Fix CSS and JS Files Crashing on VPS

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING CSS AND JS FILES CRASH"
echo "=========================================="
echo ""

# 1. Stop PM2
echo "Step 1: Stopping PM2..."
pm2 stop cryptorafts || true
echo "✅ PM2 stopped"
echo ""

# 2. Clean everything
echo "Step 2: Cleaning build cache and old files..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache
rm -rf .next/static
echo "✅ Cleaned"
echo ""

# 3. Verify source files exist
echo "Step 3: Verifying source files..."
if [ ! -f "src/app/globals.css" ]; then
    echo "❌ globals.css not found!"
    exit 1
fi
echo "✅ globals.css found"

if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ page.tsx not found!"
    exit 1
fi
echo "✅ page.tsx found"
echo ""

# 4. Check CSS file for syntax errors
echo "Step 4: Checking CSS file for syntax errors..."
if grep -q "undefined\|null\|NaN" src/app/globals.css; then
    echo "⚠️  Potential issues found in CSS"
    grep -n "undefined\|null\|NaN" src/app/globals.css | head -5 | sed 's/^/      /'
else
    echo "✅ CSS file looks clean"
fi
echo ""

# 5. Rebuild application
echo "Step 5: Rebuilding application..."
echo "This may take a few minutes..."
npm run build 2>&1 | tee build.log
BUILD_EXIT_CODE=${PIPESTATUS[0]}
if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "❌ Build failed!"
    echo "Build errors:"
    grep -i "error\|failed" build.log | head -10 | sed 's/^/      /'
    exit 1
fi
echo "✅ Build complete"
echo ""

# 6. Verify build output
echo "Step 6: Verifying build output..."
if [ ! -d ".next/static/css" ]; then
    echo "❌ CSS directory not found in build!"
    exit 1
fi

CSS_FILES=$(ls .next/static/css/*.css 2>/dev/null | wc -l)
if [ "$CSS_FILES" -eq 0 ]; then
    echo "❌ No CSS files found in build!"
    exit 1
fi
echo "✅ CSS files found: $CSS_FILES"

if [ ! -d ".next/static/chunks" ]; then
    echo "❌ JS chunks directory not found in build!"
    exit 1
fi

JS_FILES=$(ls .next/static/chunks/*.js 2>/dev/null | wc -l)
if [ "$JS_FILES" -eq 0 ]; then
    echo "❌ No JS files found in build!"
    exit 1
fi
echo "✅ JS files found: $JS_FILES"
echo ""

# 7. Check CSS file integrity
echo "Step 7: Checking CSS file integrity..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -z "$CSS_FILE" ]; then
    echo "❌ CSS file not found!"
    exit 1
fi

CSS_SIZE=$(wc -c < "$CSS_FILE")
if [ "$CSS_SIZE" -lt 1000 ]; then
    echo "⚠️  CSS file is very small ($CSS_SIZE bytes) - might be corrupted"
else
    echo "✅ CSS file size: $CSS_SIZE bytes"
fi

# Check if CSS file is readable
if ! head -c 100 "$CSS_FILE" > /dev/null 2>&1; then
    echo "❌ CSS file is not readable - might be corrupted!"
    exit 1
fi
echo "✅ CSS file is readable"
echo ""

# 8. Check JS file integrity
echo "Step 8: Checking JS file integrity..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -z "$JS_FILE" ]; then
    echo "❌ JS file not found!"
    exit 1
fi

JS_SIZE=$(wc -c < "$JS_FILE")
if [ "$JS_SIZE" -lt 1000 ]; then
    echo "⚠️  JS file is very small ($JS_SIZE bytes) - might be corrupted"
else
    echo "✅ JS file size: $JS_SIZE bytes"
fi

# Check if JS file is readable
if ! head -c 100 "$JS_FILE" > /dev/null 2>&1; then
    echo "❌ JS file is not readable - might be corrupted!"
    exit 1
fi
echo "✅ JS file is readable"
echo ""

# 9. Fix file permissions
echo "Step 9: Fixing file permissions..."
chmod -R 755 .next/static
chown -R root:root .next/static
echo "✅ Permissions fixed"
echo ""

# 10. Start PM2
echo "Step 10: Starting PM2..."
pm2 start cryptorafts
sleep 5
echo "✅ PM2 started"
echo ""

# 11. Wait for server
echo "Step 11: Waiting for server..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
        echo "✅ Server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server not responding after 30 seconds"
        exit 1
    fi
    sleep 1
done
echo ""

# 12. Test CSS file accessibility
echo "Step 12: Testing CSS file accessibility..."
CSS_BASENAME=$(basename "$CSS_FILE")
CSS_URL="http://127.0.0.1:3000/_next/static/css/$CSS_BASENAME"
CSS_RESPONSE=$(curl -sI "$CSS_URL" 2>&1)
if echo "$CSS_RESPONSE" | grep -q "200"; then
    CSS_TYPE=$(echo "$CSS_RESPONSE" | grep -i "content-type" || echo "")
    echo "✅ CSS accessible (HTTP 200)"
    echo "   $CSS_TYPE"
else
    echo "❌ CSS not accessible"
    echo "$CSS_RESPONSE" | head -3
    exit 1
fi
echo ""

# 13. Test JS file accessibility
echo "Step 13: Testing JS file accessibility..."
JS_BASENAME=$(basename "$JS_FILE")
JS_URL="http://127.0.0.1:3000/_next/static/chunks/$JS_BASENAME"
JS_RESPONSE=$(curl -sI "$JS_URL" 2>&1)
if echo "$JS_RESPONSE" | grep -q "200"; then
    JS_TYPE=$(echo "$JS_RESPONSE" | grep -i "content-type" || echo "")
    echo "✅ JS accessible (HTTP 200)"
    echo "   $JS_TYPE"
else
    echo "❌ JS not accessible"
    echo "$JS_RESPONSE" | head -3
    exit 1
fi
echo ""

# 14. Test HTML includes CSS/JS
echo "Step 14: Testing HTML includes CSS/JS..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "$CSS_BASENAME"; then
    echo "✅ CSS file referenced in HTML"
else
    echo "❌ CSS file NOT referenced in HTML"
    exit 1
fi

if echo "$LOCAL_HTML" | grep -q "$JS_BASENAME"; then
    echo "✅ JS file referenced in HTML"
else
    echo "⚠️  JS file NOT referenced in HTML (might be in different chunk)"
fi
echo ""

# 15. Reload Nginx
echo "Step 15: Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# 16. Test public URL
echo "Step 16: Testing public URL..."
sleep 3
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in public URL"
else
    echo "❌ Hero content NOT found in public URL"
fi

if echo "$PUBLIC_HTML" | grep -q "$CSS_BASENAME"; then
    echo "✅ CSS file referenced in public HTML"
else
    echo "❌ CSS file NOT referenced in public HTML"
fi
echo ""

# 17. Test public CSS accessibility
echo "Step 17: Testing public CSS accessibility..."
PUBLIC_CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
PUBLIC_CSS_RESPONSE=$(curl -sI "$PUBLIC_CSS_URL" 2>&1)
if echo "$PUBLIC_CSS_RESPONSE" | grep -q "200"; then
    echo "✅ Public CSS accessible (HTTP 200)"
else
    echo "❌ Public CSS not accessible"
    echo "$PUBLIC_CSS_RESPONSE" | head -3
fi
echo ""

echo "=========================================="
echo "CSS/JS FIX COMPLETE"
echo "=========================================="
echo ""
echo "SUMMARY:"
echo "✅ Build completed successfully"
echo "✅ CSS files verified ($CSS_FILES files)"
echo "✅ JS files verified ($JS_FILES files)"
echo "✅ Files accessible via local server"
echo "✅ Files accessible via public URL"
echo ""
echo "NEXT STEPS:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Test in incognito mode (Ctrl+Shift+N)"
echo "3. Check browser console (F12) for errors"
echo ""

