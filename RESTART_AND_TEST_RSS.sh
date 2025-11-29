#!/bin/bash
# ============================================
# RESTART AND TEST RSS FEED
# ============================================

cd /var/www/cryptorafts

echo "=========================================="
echo "RESTARTING APP AND TESTING RSS FEED"
echo "=========================================="
echo ""

# Step 1: Restart PM2
echo "[1/5] Restarting PM2..."
pm2 restart cryptorafts
sleep 5

echo ""
echo "[2/5] Checking PM2 status..."
pm2 status cryptorafts

echo ""
echo "[3/5] Testing API endpoint (/api/blog/rss)..."
curl -I http://localhost:3000/api/blog/rss

echo ""
echo "[4/5] Testing feed.xml (via rewrite)..."
curl -I http://localhost:3000/feed.xml

echo ""
echo "[5/5] Testing RSS feed content..."
curl http://localhost:3000/feed.xml | head -30

echo ""
echo "=========================================="
echo "✅ RSS FEED TEST COMPLETE"
echo "=========================================="
echo ""
echo "Expected results:"
echo "  ✅ Both endpoints return HTTP 200 OK"
echo "  ✅ Content-Type: application/rss+xml"
echo "  ✅ XML content starting with <?xml version=\"1.0\"?>"
echo ""
echo "Test from external:"
echo "  curl -I https://www.cryptorafts.com/feed.xml"
echo ""

