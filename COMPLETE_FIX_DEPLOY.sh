#!/bin/bash

# ============================================
# COMPLETE FIX DEPLOYMENT
# ============================================

echo "============================================"
echo "COMPLETE FIX DEPLOYMENT"
echo "============================================"
echo ""

cd /var/www/cryptorafts

echo "[1/3] Rebuilding app..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build complete"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "[2/3] Restarting PM2..."
pm2 restart cryptorafts
if [ $? -eq 0 ]; then
    echo "✅ PM2 restarted"
else
    echo "❌ PM2 restart failed"
    exit 1
fi

echo ""
echo "[3/3] Checking PM2 status..."
pm2 status

echo ""
echo "============================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "============================================"
echo ""
echo "The app should now be working correctly."
echo "Refresh your browser to see the changes."
echo ""

