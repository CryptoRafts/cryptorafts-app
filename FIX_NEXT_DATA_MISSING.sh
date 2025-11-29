#!/bin/bash
# Fix Missing __NEXT_DATA__ - Force Dynamic Rendering

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING MISSING __NEXT_DATA__"
echo "=========================================="
echo ""

# 1. Verify page.tsx has dynamic export
echo "Step 1: Verifying page.tsx configuration..."
if grep -q "export const dynamic = 'force-dynamic'" src/app/page.tsx; then
    echo "✅ Dynamic rendering configured"
else
    echo "❌ Dynamic rendering NOT configured!"
    echo "   Need to add: export const dynamic = 'force-dynamic';"
    exit 1
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
else
    echo "⚠️  Homepage might be static (○)"
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
    echo "✅ __NEXT_DATA__ found in local server"
else
    echo "❌ __NEXT_DATA__ NOT found in local server"
fi

PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$PUBLIC_HTML" | grep -q "__NEXT_DATA__"; then
    echo "✅ __NEXT_DATA__ found in public URL"
else
    echo "❌ __NEXT_DATA__ NOT found in public URL"
fi
echo ""

# 9. Reload Nginx
echo "Step 9: Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# 10. Final test
echo "Step 10: Final test..."
sleep 3
FINAL_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$FINAL_HTML" | grep -q "__NEXT_DATA__"; then
    echo "✅ __NEXT_DATA__ found in final test"
else
    echo "❌ __NEXT_DATA__ NOT found in final test"
fi

if echo "$FINAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in final test"
else
    echo "❌ Hero content NOT found in final test"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Test in incognito mode (Ctrl+Shift+N)"
echo "3. Check browser console (F12) for errors"
echo "4. Verify __NEXT_DATA__ is in HTML"
echo ""

