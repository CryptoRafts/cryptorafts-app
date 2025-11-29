#!/bin/bash

# ============================================
# VERIFY APP STATUS
# ============================================

echo "============================================"
echo "VERIFYING APP STATUS"
echo "============================================"
echo ""

cd /var/www/cryptorafts

echo "[1/4] Checking PM2 status..."
pm2 status
if [ $? -eq 0 ]; then
    echo "✅ PM2 is running"
else
    echo "❌ PM2 is not running"
fi

echo ""
echo "[2/4] Checking if app responds..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ App is responding (HTTP $RESPONSE)"
else
    echo "❌ App is not responding (HTTP $RESPONSE)"
fi

echo ""
echo "[3/4] Checking build files..."
if [ -f ".next/build-manifest.json" ]; then
    echo "✅ Build manifest exists"
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    echo "❌ Build manifest missing"
fi

echo ""
echo "[4/4] Checking recent logs..."
echo "Last 10 lines of logs:"
pm2 logs cryptorafts --lines 10 --nostream | tail -10

echo ""
echo "============================================"
echo "VERIFICATION COMPLETE"
echo "============================================"
echo ""
echo "Your app should be working at:"
echo "  https://www.cryptorafts.com"
echo ""
echo "Note: 'Loading spotlights...' is normal - it shows for 1-2 seconds while data loads."
echo ""

