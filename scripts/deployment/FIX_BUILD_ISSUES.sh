#!/bin/bash
# ============================================
# FIX BUILD ISSUES AND REBUILD APP
# ============================================

set -e

echo "=========================================="
echo "FIXING BUILD ISSUES"
echo "=========================================="
echo ""

cd /var/www/cryptorafts

# Step 1: Clean build artifacts
echo "[1/4] Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
echo "  ✅ Cleaned build artifacts"
echo ""

# Step 2: Rebuild the application
echo "[2/4] Rebuilding application..."
echo "  This takes 2-3 minutes..."
npm run build
if [ $? -eq 0 ]; then
    echo "  ✅ Build successful"
else
    echo "  ❌ Build failed"
    exit 1
fi
echo ""

# Step 3: Verify build files
echo "[3/4] Verifying build files..."
if [ -f ".next/build-manifest.json" ]; then
    echo "  ✅ build-manifest.json exists"
else
    echo "  ⚠️  build-manifest.json missing (this might be OK for Next.js 16)"
fi

if [ -d ".next/static" ]; then
    echo "  ✅ Static files directory exists"
else
    echo "  ❌ Static files directory missing!"
    exit 1
fi
echo ""

# Step 4: Restart PM2
echo "[4/4] Restarting PM2..."
pm2 restart cryptorafts
if [ $? -eq 0 ]; then
    echo "  ✅ PM2 restarted"
else
    echo "  ❌ PM2 restart failed"
    exit 1
fi
echo ""

echo "=========================================="
echo "✅ BUILD FIX COMPLETE!"
echo "=========================================="
echo ""
echo "Your app should now work properly."
echo "Check: https://www.cryptorafts.com"
echo ""

