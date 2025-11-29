#!/bin/bash
set -e

echo "========================================="
echo "FIXING BUILD PERMISSIONS AND REBUILDING"
echo "========================================="
echo ""

cd /var/www/cryptorafts

# Step 1: Fix permissions for node_modules/.bin
echo "Step 1: Fixing permissions for node_modules/.bin..."
chmod +x node_modules/.bin/* 2>/dev/null || true
echo "✅ Permissions fixed"
echo ""

# Step 2: Stop PM2
echo "Step 2: Stopping PM2..."
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
echo "✅ PM2 stopped"
echo ""

# Step 3: Clean build artifacts
echo "Step 3: Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache
echo "✅ Build artifacts cleaned"
echo ""

# Step 4: Rebuild
echo "Step 4: Rebuilding application..."
npm run build
echo "✅ Build completed"
echo ""

# Step 5: Verify build artifacts
echo "Step 5: Verifying build artifacts..."
if [ -d ".next/static/css" ] && [ -d ".next/static/chunks" ] && [ -f ".next/server/app/page.js" ]; then
    echo "✅ CSS files: $(ls -1 .next/static/css/ | wc -l)"
    echo "✅ JS chunks: $(ls -1 .next/static/chunks/ | wc -l)"
    echo "✅ Server page.js: EXISTS"
    echo "✅ Build artifacts verified."
else
    echo "❌ Build artifacts missing. Something went wrong with the build."
    exit 1
fi
echo ""

# Step 6: Start PM2
echo "Step 6: Starting PM2..."
pm2 start ecosystem.config.js --env production
echo "✅ PM2 started."
echo ""

# Step 7: Verify PM2 status
echo "Step 7: Verifying PM2 status..."
pm2 status
echo ""

# Step 8: Verify server response
echo "Step 8: Verifying server response..."
sleep 3
curl -s http://localhost:3000 | head -20
echo ""

# Step 9: Reload Nginx
echo "Step 9: Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx || sudo service nginx reload
echo "✅ Nginx reloaded."
echo ""

echo "========================================="
echo "BUILD FIXED AND RESTARTED!"
echo "========================================="

