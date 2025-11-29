#!/bin/bash
# Check for Hydration Errors in Production Build

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "CHECKING FOR HYDRATION ERRORS"
echo "=========================================="
echo ""

# 1. Check PM2 logs for hydration errors
echo "1. Checking PM2 logs for hydration errors..."
HYDRATION_ERRORS=$(pm2 logs cryptorafts --lines 100 --nostream 2>&1 | grep -i "hydration\|mismatch\|hydration failed" || true)
if [ -n "$HYDRATION_ERRORS" ]; then
    echo "   ⚠️  Hydration errors found in logs:"
    echo "$HYDRATION_ERRORS" | head -10 | sed 's/^/      /'
else
    echo "   ✅ No hydration errors in logs"
fi
echo ""

# 2. Check for browser API usage in page.tsx
echo "2. Checking for browser API usage in page.tsx..."
if grep -q "window\|document\|localStorage\|sessionStorage" src/app/page.tsx; then
    echo "   ⚠️  Browser API usage found in page.tsx:"
    grep -n "window\|document\|localStorage\|sessionStorage" src/app/page.tsx | head -5 | sed 's/^/      /'
else
    echo "   ✅ No direct browser API usage found"
fi
echo ""

# 3. Check for Date() or Math.random() usage
echo "3. Checking for Date() or Math.random() usage..."
if grep -q "new Date()\|Math.random()" src/app/page.tsx; then
    echo "   ⚠️  Time/random data usage found:"
    grep -n "new Date()\|Math.random()" src/app/page.tsx | head -5 | sed 's/^/      /'
else
    echo "   ✅ No time/random data usage found"
fi
echo ""

# 4. Check for invalid HTML nesting
echo "4. Checking HTML structure in page.tsx..."
if grep -q "<p>.*<div\|<p>.*<section\|<p>.*<button" src/app/page.tsx; then
    echo "   ⚠️  Potential invalid HTML nesting found:"
    grep -n "<p>.*<div\|<p>.*<section\|<p>.*<button" src/app/page.tsx | head -5 | sed 's/^/      /'
else
    echo "   ✅ No obvious invalid HTML nesting found"
fi
echo ""

# 5. Check for use client directive
echo "5. Checking for 'use client' directive..."
if grep -q "^'use client'" src/app/page.tsx || grep -q '^"use client"' src/app/page.tsx; then
    echo "   ✅ 'use client' directive found"
else
    echo "   ⚠️  'use client' directive NOT found"
fi
echo ""

# 6. Check for useEffect hooks
echo "6. Checking for useEffect hooks..."
USE_EFFECT_COUNT=$(grep -c "useEffect" src/app/page.tsx || echo "0")
echo "   useEffect hooks found: $USE_EFFECT_COUNT"
if [ "$USE_EFFECT_COUNT" -gt 0 ]; then
    echo "   ✅ useEffect hooks present (good for client-side only code)"
fi
echo ""

# 7. Check for dynamic imports
echo "7. Checking for dynamic imports..."
if grep -q "dynamic\|next/dynamic" src/app/page.tsx; then
    echo "   ✅ Dynamic imports found:"
    grep -n "dynamic\|next/dynamic" src/app/page.tsx | head -5 | sed 's/^/      /'
else
    echo "   ℹ️  No dynamic imports found"
fi
echo ""

# 8. Test production build HTML
echo "8. Testing production build HTML..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "__NEXT_DATA__"; then
    echo "   ✅ __NEXT_DATA__ found in HTML"
else
    echo "   ⚠️  __NEXT_DATA__ NOT found in HTML"
fi

if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content found in HTML"
else
    echo "   ❌ Hero content NOT found in HTML"
fi

if echo "$LOCAL_HTML" | grep -q "hero-content"; then
    echo "   ✅ hero-content class found in HTML"
else
    echo "   ❌ hero-content class NOT found in HTML"
fi
echo ""

# 9. Check browser console errors (via HTML inspection)
echo "9. Checking for script errors in HTML..."
SCRIPT_ERRORS=$(echo "$LOCAL_HTML" | grep -i "error\|exception\|failed" || true)
if [ -n "$SCRIPT_ERRORS" ]; then
    echo "   ⚠️  Potential errors found in HTML:"
    echo "$SCRIPT_ERRORS" | head -5 | sed 's/^/      /'
else
    echo "   ✅ No obvious errors in HTML"
fi
echo ""

echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Check browser console (F12) for hydration errors"
echo "2. Test production build locally: npm run build && npm run start"
echo "3. Check Elements tab for HTML structure issues"
echo ""

