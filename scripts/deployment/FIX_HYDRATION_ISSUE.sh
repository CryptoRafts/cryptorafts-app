#!/bin/bash
# Fix Hydration Issue - Ensure Server/Client Match

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FIXING HYDRATION ISSUE"
echo "=========================================="
echo ""

# 1. Check current page.tsx
echo "Step 1: Checking page.tsx..."
if [ ! -f "src/app/page.tsx" ]; then
    echo "❌ page.tsx not found!"
    exit 1
fi

# 2. Check for isClient usage
if grep -q "isClient" src/app/page.tsx; then
    echo "⚠️  Found isClient state - potential hydration issue"
else
    echo "✅ No isClient state found"
fi

# 3. Check for window/document usage
if grep -q "window\|document" src/app/page.tsx; then
    echo "⚠️  Found window/document usage - checking if in useEffect..."
    if grep -A 5 "useEffect" src/app/page.tsx | grep -q "window\|document"; then
        echo "✅ window/document usage is in useEffect (correct)"
    else
        echo "❌ window/document usage outside useEffect (WRONG!)"
    fi
fi

# 4. Rebuild with production mode
echo ""
echo "Step 2: Rebuilding in production mode..."
pm2 stop cryptorafts || true
rm -rf .next/cache
npm run build

# 5. Check build for hydration warnings
echo ""
echo "Step 3: Checking build output for hydration warnings..."
if grep -i "hydration\|mismatch" .next/build-manifest.json 2>/dev/null; then
    echo "⚠️  Found hydration warnings in build"
else
    echo "✅ No hydration warnings in build manifest"
fi

# 6. Start PM2
echo ""
echo "Step 4: Starting PM2..."
pm2 start cryptorafts
sleep 5

# 7. Test local server
echo ""
echo "Step 5: Testing local server..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Hero content found in local server"
else
    echo "❌ Hero content NOT found in local server"
    echo "   HTML length: $(echo "$LOCAL_HTML" | wc -c) bytes"
fi

# 8. Check for __NEXT_DATA__
if echo "$LOCAL_HTML" | grep -q "__NEXT_DATA__"; then
    echo "✅ __NEXT_DATA__ found (hydration data present)"
else
    echo "❌ __NEXT_DATA__ NOT found (hydration data missing!)"
fi

# 9. Reload Nginx
echo ""
echo "Step 6: Reloading Nginx..."
systemctl reload nginx

echo ""
echo "=========================================="
echo "HYDRATION CHECK COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Check browser console (F12) for hydration errors"
echo "2. Look for 'Hydration failed' or 'Text content mismatch' errors"
echo "3. Clear browser cache (Ctrl+Shift+Delete)"
echo "4. Test in incognito mode (Ctrl+Shift+N)"
echo ""

