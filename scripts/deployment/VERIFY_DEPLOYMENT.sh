#!/bin/bash

# ============================================
# VERIFY DEPLOYMENT - Check Everything
# ============================================

echo "============================================"
echo "VERIFYING DEPLOYMENT"
echo "============================================"
echo ""

cd /var/www/cryptorafts

echo "[1/6] Checking PM2 status..."
pm2 status
if [ $? -eq 0 ]; then
    echo "✅ PM2 is running"
else
    echo "❌ PM2 is not running"
    exit 1
fi

echo ""
echo "[2/6] Checking if app is responding..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ App is responding (HTTP $RESPONSE)"
else
    echo "❌ App is not responding (HTTP $RESPONSE)"
fi

echo ""
echo "[3/6] Checking build files..."
if [ -f .next/build-manifest.json ]; then
    echo "✅ Build manifest exists"
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    echo "❌ Build manifest missing"
fi

echo ""
echo "[4/6] Checking fixed files..."
FILES=(
    "src/components/SpotlightDisplay.tsx"
    "src/components/PerfectHeader.tsx"
    "src/providers/SimpleAuthProvider.tsx"
    "src/app/page.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "[5/6] Checking PM2 logs for errors..."
ERRORS=$(pm2 logs cryptorafts --lines 50 --nostream 2>&1 | grep -i "error\|failed\|exception" | tail -5)
if [ -z "$ERRORS" ]; then
    echo "✅ No recent errors in logs"
else
    echo "⚠️  Recent errors found:"
    echo "$ERRORS"
fi

echo ""
echo "[6/6] Checking Nginx proxy..."
NGINX_STATUS=$(systemctl is-active nginx)
if [ "$NGINX_STATUS" = "active" ]; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

echo ""
echo "============================================"
echo "VERIFICATION COMPLETE"
echo "============================================"
echo ""
echo "Your app should be working at:"
echo "  https://www.cryptorafts.com"
echo "  http://72.61.98.99:3000"
echo ""
echo "If issues persist, check:"
echo "  pm2 logs cryptorafts"
echo "  sudo tail -f /var/log/nginx/error.log"
echo ""
