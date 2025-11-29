#!/bin/bash
set -e

echo "========================================"
echo "FIXING BUILD AND RESTARTING"
echo "========================================"
echo ""

cd /var/www/cryptorafts

# Step 1: Stop PM2
echo "Step 1: Stopping PM2..."
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
echo "PM2 stopped"
echo ""

# Step 2: Clean build artifacts
echo "Step 2: Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache
echo "Build artifacts cleaned"
echo ""

# Step 3: Rebuild
echo "Step 3: Rebuilding application..."
npm run build
echo "Build completed"
echo ""

# Step 4: Verify build artifacts
echo "Step 4: Verifying build artifacts..."
if [ -d ".next/static/css" ] && [ -d ".next/static/chunks" ]; then
    echo "CSS files: $(ls -1 .next/static/css/ | wc -l)"
    echo "JS chunks: $(ls -1 .next/static/chunks/ | wc -l)"
    echo "Build artifacts verified"
else
    echo "ERROR: Build artifacts missing!"
    exit 1
fi
echo ""

# Step 5: Start PM2
echo "Step 5: Starting PM2..."
pm2 start ecosystem.config.js
pm2 save
echo "PM2 started"
echo ""

# Step 6: Wait and verify
echo "Step 6: Waiting for server to start..."
sleep 5

# Step 7: Check server
echo "Step 7: Checking server..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Server is running on port 3000"
else
    echo "WARNING: Server check failed (may need more time)"
fi
echo ""

# Step 8: Check CSS file
echo "Step 8: Checking CSS file..."
CSS_FILE=$(ls -1 .next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    if curl -f "http://localhost:3000/_next/static/css/$CSS_BASENAME" > /dev/null 2>&1; then
        echo "CSS file is accessible: $CSS_BASENAME"
    else
        echo "WARNING: CSS file not accessible via HTTP"
    fi
else
    echo "WARNING: No CSS file found"
fi
echo ""

echo "========================================"
echo "FIX COMPLETE!"
echo "========================================"
echo ""
echo "PM2 Status:"
pm2 status
echo ""

