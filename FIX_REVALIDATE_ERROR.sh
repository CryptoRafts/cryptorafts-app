#!/bin/bash
# Fix revalidate error and ensure __NEXT_DATA__ is included

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING REVALIDATE ERROR AND __NEXT_DATA__"
echo "=========================================="
echo ""

# 1. Verify page.tsx doesn't have invalid exports
echo "Step 1: Verifying page.tsx configuration..."
if grep -q "export const revalidate" src/app/page.tsx; then
    echo "❌ Invalid revalidate export found!"
    echo "   Removing invalid exports..."
    # Remove invalid exports
    sed -i '/export const dynamic = .force-dynamic./d' src/app/page.tsx
    sed -i '/export const revalidate = 0/d' src/app/page.tsx
    echo "✅ Invalid exports removed"
else
    echo "✅ No invalid exports found"
fi

if grep -q "export const dynamic" src/app/page.tsx; then
    echo "⚠️  Dynamic export found (should not be in client component)"
    sed -i '/export const dynamic = .force-dynamic./d' src/app/page.tsx
    echo "✅ Dynamic export removed"
fi
echo ""

# 2. Stop PM2
echo "Step 2: Stopping PM2..."
pm2 stop cryptorafts || true
echo "✅ PM2 stopped"
echo ""

# 3. Clean build cache
echo "Step 3: Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache
echo "✅ Build cache cleaned"
echo ""

# 4. Rebuild
echo "Step 4: Rebuilding application..."
npm run build 2>&1 | tee build.log
BUILD_EXIT_CODE=${PIPESTATUS[0]}
if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "❌ Build failed!"
    grep -i "error\|failed" build.log | head -10 | sed 's/^/      /'
    exit 1
fi
echo "✅ Build complete"
echo ""

# 5. Check build output
echo "Step 5: Checking build output..."
if grep -q "ƒ /" build.log; then
    echo "✅ Homepage marked as dynamic (ƒ)"
elif grep -q "○ /" build.log; then
    echo "⚠️  Homepage marked as static (○)"
else
    echo "ℹ️  Could not determine build type"
fi
echo ""

# 6. Start PM2
echo "Step 6: Starting PM2..."
pm2 start cryptorafts
sleep 5
echo "✅ PM2 started"
echo ""

# 7. Wait for server
echo "Step 7: Waiting for server..."
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

# 8. Test for __NEXT_DATA__
echo "Step 8: Testing for __NEXT_DATA__..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "__NEXT_DATA__"; then
    echo "✅ __NEXT_DATA__ found in local server HTML"
else
    echo "❌ __NEXT_DATA__ NOT found in local server HTML"
    echo "   This may indicate a static generation issue"
fi
echo ""

# 9. Test public URL
echo "Step 9: Testing public URL..."
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$PUBLIC_HTML" | grep -q "__NEXT_DATA__"; then
    echo "✅ __NEXT_DATA__ found in public URL HTML"
else
    echo "❌ __NEXT_DATA__ NOT found in public URL HTML"
    echo "   This may indicate a caching or Nginx issue"
fi
echo ""

# 10. Reload Nginx
echo "Step 10: Reloading Nginx..."
systemctl reload nginx || true
echo "✅ Nginx reloaded"
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "SUMMARY:"
echo "- Removed invalid revalidate/dynamic exports"
echo "- Rebuilt application"
echo "- Restarted PM2"
echo "- Tested __NEXT_DATA__ presence"
echo ""
echo "If __NEXT_DATA__ is still missing, check:"
echo "1. Browser cache (hard refresh: Ctrl+Shift+R)"
echo "2. CDN/proxy cache"
echo "3. Nginx caching configuration"
echo ""

