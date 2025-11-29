#!/bin/bash
# ============================================
# REBUILD FEED.XML ROUTE - FINAL FIX
# ============================================

cd /var/www/cryptorafts

echo "=========================================="
echo "REBUILDING FEED.XML ROUTE"
echo "=========================================="
echo ""

# Step 1: Verify route file exists
echo "[1/6] Verifying route file..."
if [ -f "src/app/feed.xml/route.ts" ]; then
    echo "  ✓ Route file exists"
else
    echo "  ✗ Route file missing!"
    exit 1
fi

# Step 2: Test API route
echo ""
echo "[2/6] Testing API route..."
curl -I http://localhost:3000/api/blog/rss 2>&1 | head -3

# Step 3: Delete old build
echo ""
echo "[3/6] Cleaning old build..."
rm -rf .next
echo "  ✓ Old build removed"

# Step 4: Rebuild Next.js
echo ""
echo "[4/6] Rebuilding Next.js (this takes 2-3 minutes)..."
npm run build
if [ $? -eq 0 ]; then
    echo "  ✓ Build successful"
else
    echo "  ✗ Build failed!"
    exit 1
fi

# Step 5: Restart PM2
echo ""
echo "[5/6] Restarting PM2..."
pm2 restart cryptorafts
sleep 10
echo "  ✓ PM2 restarted"

# Step 6: Test feed
echo ""
echo "[6/6] Testing feed..."
echo ""
echo "Testing localhost..."
curl -I http://localhost:3000/feed.xml 2>&1 | head -5

echo ""
echo "Testing feed content..."
curl http://localhost:3000/feed.xml 2>&1 | head -10

echo ""
echo "=========================================="
echo "REBUILD COMPLETE!"
echo "=========================================="
echo ""
echo "Now test external feed:"
echo "  curl -I https://www.cryptorafts.com/feed.xml"
echo ""
echo "If still 404, clear Nginx cache:"
echo "  sudo rm -rf /var/cache/nginx/*"
echo "  sudo systemctl reload nginx"
echo ""

