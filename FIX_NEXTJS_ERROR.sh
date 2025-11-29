#!/bin/bash
# Fix Next.js clientReferenceManifest error
# Run this directly on VPS: ssh root@72.61.98.99
# cd /var/www/cryptorafts && bash FIX_NEXTJS_ERROR.sh

echo "========================================"
echo "Fixing Next.js Build Error"
echo "========================================"
echo ""

cd /var/www/cryptorafts

# Step 1: Stop PM2
echo "Step 1: Stopping PM2..."
pm2 stop cryptorafts
echo ""

# Step 2: Clean build artifacts
echo "Step 2: Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache
echo "Clean complete!"
echo ""

# Step 3: Rebuild
echo "Step 3: Rebuilding application..."
npm run build 2>&1 | tail -30
echo ""

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo ""
    
    # Step 4: Verify build artifacts
    echo "Step 4: Verifying build artifacts..."
    if [ -f ".next/BUILD_ID" ] && [ -f ".next/build-manifest.json" ]; then
        echo "Build artifacts verified!"
    else
        echo "WARNING: Some build artifacts missing!"
    fi
    echo ""
    
    # Step 5: Restart PM2
    echo "Step 5: Restarting PM2..."
    pm2 restart cryptorafts --update-env
    echo ""
    
    # Step 6: Wait a moment for server to start
    echo "Step 6: Waiting for server to start..."
    sleep 5
    echo ""
    
    # Step 7: Check status
    echo "Step 7: PM2 Status:"
    pm2 status
    echo ""
    
    # Step 8: Test server
    echo "Step 8: Testing server..."
    curl -I http://localhost:3000 2>&1 | head -10
    echo ""
    
    echo "========================================"
    echo "FIX COMPLETE!"
    echo "========================================"
    echo ""
    echo "Check the website: https://www.cryptorafts.com"
    echo ""
    echo "If you still see 'Loading...', clear your browser cache:"
    echo "1. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
    echo "2. Or use Incognito/Private mode"
    echo ""
else
    echo "Build failed! Check errors above."
    exit 1
fi

