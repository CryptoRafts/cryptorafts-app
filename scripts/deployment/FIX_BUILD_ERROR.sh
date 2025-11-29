#!/bin/bash

# ============================================
# FIX BUILD ERROR - Complete Rebuild
# ============================================

set -e

VPS_PATH="/var/www/cryptorafts"

echo "============================================"
echo "🔧 FIXING BUILD ERROR"
echo "============================================"
echo ""

cd "$VPS_PATH" || exit 1

# Step 1: Stop PM2
echo "[1/6] Stopping PM2..."
pm2 stop cryptorafts || true
echo "✅ PM2 stopped"

# Step 2: Clean .next directory
echo ""
echo "[2/6] Cleaning .next directory..."
rm -rf .next
echo "✅ .next directory cleaned"

# Step 3: Clean node_modules/.cache
echo ""
echo "[3/6] Cleaning cache..."
rm -rf node_modules/.cache
rm -rf .next/cache 2>/dev/null || true
echo "✅ Cache cleaned"

# Step 4: Rebuild application
echo ""
echo "[4/6] Rebuilding application..."
echo "This may take 2-3 minutes..."
npm run build 2>&1 | tail -50
echo "✅ Build completed"

# Step 5: Verify build artifacts
echo ""
echo "[5/6] Verifying build artifacts..."
if [ -f ".next/build-manifest.json" ]; then
    echo "✅ build-manifest.json exists"
else
    echo "❌ build-manifest.json MISSING - rebuild failed"
    exit 1
fi

if [ -d ".next/static" ]; then
    echo "✅ Static files directory exists"
    ls -la .next/static | head -5
else
    echo "❌ Static files directory MISSING"
    exit 1
fi

# Step 6: Restart PM2
echo ""
echo "[6/6] Restarting PM2..."
pm2 restart cryptorafts || pm2 start ecosystem.config.js
echo "✅ PM2 restarted"

echo ""
echo "============================================"
echo "✅ BUILD FIX COMPLETE!"
echo "============================================"
echo ""
echo "Your app should now be working at:"
echo "  https://www.cryptorafts.com"
echo ""

