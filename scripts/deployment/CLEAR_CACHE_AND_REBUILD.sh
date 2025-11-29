#!/bin/bash

# ============================================
# CLEAR CACHE AND REBUILD
# ============================================

echo "============================================"
echo "CLEARING CACHE AND REBUILDING"
echo "============================================"
echo ""

cd /var/www/cryptorafts

echo "[1/5] Stopping PM2..."
pm2 stop cryptorafts || true
echo "✅ PM2 stopped"

echo ""
echo "[2/5] Clearing Next.js cache..."
rm -rf .next
echo "✅ Cache cleared"

echo ""
echo "[3/5] Rebuilding app..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build complete"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "[4/5] Starting PM2..."
pm2 restart cryptorafts || pm2 start npm --name cryptorafts -- start
if [ $? -eq 0 ]; then
    echo "✅ PM2 started"
else
    echo "❌ PM2 start failed"
    exit 1
fi

echo ""
echo "[5/5] Reloading Nginx..."
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded"
else
    echo "⚠️  Nginx reload may have failed"
fi

echo ""
echo "============================================"
echo "✅ REBUILD COMPLETE"
echo "============================================"
echo ""
echo "Checking status..."
sleep 3
pm2 status
pm2 logs cryptorafts --lines 10 --nostream

echo ""
echo "Your app should now be working at:"
echo "  https://www.cryptorafts.com"
echo ""
echo "Clear your browser cache (Ctrl+Shift+R) to see changes."
echo ""

