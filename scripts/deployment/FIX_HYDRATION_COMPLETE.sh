#!/bin/bash
# Complete Hydration Fix - Check and Fix All Issues

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "COMPLETE HYDRATION FIX"
echo "=========================================="
echo ""

# 1. Check for hydration errors in logs
echo "Step 1: Checking PM2 logs for hydration errors..."
HYDRATION_ERRORS=$(pm2 logs cryptorafts --lines 200 --nostream 2>&1 | grep -i "hydration\|mismatch\|hydration failed\|invariant" || true)
if [ -n "$HYDRATION_ERRORS" ]; then
    echo "   ⚠️  Hydration errors found:"
    echo "$HYDRATION_ERRORS" | head -10 | sed 's/^/      /'
else
    echo "   ✅ No hydration errors in logs"
fi
echo ""

# 2. Check page.tsx for issues
echo "Step 2: Checking page.tsx for potential issues..."
if grep -q "window\|document\|localStorage" src/app/page.tsx | grep -v "useEffect\|typeof window"; then
    echo "   ⚠️  Potential browser API usage outside useEffect:"
    grep -n "window\|document\|localStorage" src/app/page.tsx | grep -v "useEffect\|typeof window" | head -5 | sed 's/^/      /'
else
    echo "   ✅ Browser APIs properly wrapped in useEffect"
fi
echo ""

# 3. Check child components
echo "Step 3: Checking child components..."
if [ -f "src/components/SpotlightDisplay.tsx" ]; then
    if grep -q "window\|document\|localStorage" src/components/SpotlightDisplay.tsx | grep -v "useEffect\|typeof window"; then
        echo "   ⚠️  SpotlightDisplay may have browser API issues"
    else
        echo "   ✅ SpotlightDisplay looks good"
    fi
else
    echo "   ⚠️  SpotlightDisplay.tsx not found"
fi

if [ -f "src/components/RealtimeStats.tsx" ]; then
    if grep -q "window\|document\|localStorage" src/components/RealtimeStats.tsx | grep -v "useEffect\|typeof window"; then
        echo "   ⚠️  RealtimeStats may have browser API issues"
    else
        echo "   ✅ RealtimeStats looks good"
    fi
else
    echo "   ⚠️  RealtimeStats.tsx not found"
fi
echo ""

# 4. Stop PM2
echo "Step 4: Stopping PM2..."
pm2 stop cryptorafts || true
echo "✅ PM2 stopped"
echo ""

# 5. Clean build cache
echo "Step 5: Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache
echo "✅ Build cache cleaned"
echo ""

# 6. Rebuild
echo "Step 6: Rebuilding application..."
npm run build 2>&1 | tee build.log
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ Build failed! Check build.log for errors"
    exit 1
fi
echo "✅ Build complete"
echo ""

# 7. Check build output for warnings
echo "Step 7: Checking build output for warnings..."
if grep -i "warning\|error\|hydration\|mismatch" build.log | grep -v "Social Share Service"; then
    echo "   ⚠️  Build warnings found:"
    grep -i "warning\|error\|hydration\|mismatch" build.log | grep -v "Social Share Service" | head -10 | sed 's/^/      /'
else
    echo "   ✅ No critical warnings in build"
fi
echo ""

# 8. Start PM2
echo "Step 8: Starting PM2..."
pm2 start cryptorafts
sleep 5
echo "✅ PM2 started"
echo ""

# 9. Wait for server
echo "Step 9: Waiting for server..."
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

# 10. Test local server
echo "Step 10: Testing local server..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content found in local server"
else
    echo "   ❌ Hero content NOT found in local server"
    echo "   HTML length: $(echo "$LOCAL_HTML" | wc -c) bytes"
fi

if echo "$LOCAL_HTML" | grep -q "__NEXT_DATA__"; then
    echo "   ✅ __NEXT_DATA__ found in HTML"
else
    echo "   ⚠️  __NEXT_DATA__ NOT found in HTML"
fi

if echo "$LOCAL_HTML" | grep -q "hero-content"; then
    echo "   ✅ hero-content class found in HTML"
else
    echo "   ❌ hero-content class NOT found in HTML"
fi
echo ""

# 11. Reload Nginx
echo "Step 11: Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# 12. Test public URL
echo "Step 12: Testing public URL..."
sleep 3
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content found in public URL"
else
    echo "   ❌ Hero content NOT found in public URL"
    echo "   HTML length: $(echo "$PUBLIC_HTML" | wc -c) bytes"
fi
echo ""

echo "=========================================="
echo "HYDRATION FIX COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Test production build locally: npm run build && npm run start"
echo "2. Check browser console (F12) for hydration errors"
echo "3. Clear browser cache (Ctrl+Shift+Delete)"
echo "4. Test in incognito mode (Ctrl+Shift+N)"
echo ""
echo "If issues persist, check:"
echo "- Browser console for hydration errors"
echo "- Elements tab for HTML structure"
echo "- Network tab for CSS/JS loading"
echo ""

