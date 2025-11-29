#!/bin/bash

# ============================================
# FIX UI COMPLETE - Deploy All Fixes
# ============================================

set -e

VPS_PATH="/var/www/cryptorafts"

echo "============================================"
echo "FIXING UI - COMPLETE DEPLOYMENT"
echo "============================================"
echo ""

cd "$VPS_PATH"

echo "[1/6] Stopping PM2..."
pm2 stop cryptorafts || true
echo "✅ PM2 stopped"

echo ""
echo "[2/6] Clearing Next.js cache..."
rm -rf .next
echo "✅ Cache cleared"

echo ""
echo "[3/6] Verifying fixed files exist..."
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
        echo "❌ $file MISSING - need to upload"
    fi
done

echo ""
echo "[4/6] Rebuilding app with all fixes..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build complete"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "[5/6] Starting PM2..."
pm2 restart cryptorafts || pm2 start npm --name cryptorafts -- start
if [ $? -eq 0 ]; then
    echo "✅ PM2 started"
else
    echo "❌ PM2 start failed"
    exit 1
fi

echo ""
echo "[6/6] Reloading Nginx..."
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded"
else
    echo "⚠️  Nginx reload may have failed"
fi

echo ""
echo "============================================"
echo "✅ UI FIX COMPLETE"
echo "============================================"
echo ""
echo "Checking status..."
sleep 3
pm2 status
pm2 logs cryptorafts --lines 15 --nostream

echo ""
echo "Your app should now be working at:"
echo "  https://www.cryptorafts.com"
echo ""
echo "Clear browser cache (Ctrl+Shift+R) to see changes."
echo ""

