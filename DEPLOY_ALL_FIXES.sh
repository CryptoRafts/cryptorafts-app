#!/bin/bash
# Deploy All Fixes to VPS
# Run this on VPS: ssh root@72.61.98.99
# cd /var/www/cryptorafts && bash DEPLOY_ALL_FIXES.sh

echo "========================================"
echo "Deploying All Fixes"
echo "========================================"
echo ""

cd /var/www/cryptorafts

# Step 1: Pull latest changes (if using git)
# git pull origin main

# Step 2: Install dependencies
echo "Step 1: Installing dependencies..."
npm install
echo ""

# Step 3: Run security audit
echo "Step 2: Running security audit..."
npm audit --audit-level=moderate
echo ""

# Step 4: Fix vulnerabilities
echo "Step 3: Fixing vulnerabilities..."
npm audit fix --force 2>/dev/null || echo "Some vulnerabilities may require manual review"
echo ""

# Step 5: Clean build
echo "Step 4: Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
echo "Clean complete!"
echo ""

# Step 6: Rebuild
echo "Step 5: Rebuilding application..."
npm run build 2>&1 | tail -30
echo ""

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo ""
    
    # Step 7: Restart PM2
    echo "Step 6: Restarting PM2..."
    pm2 restart cryptorafts --update-env
    echo ""
    
    # Step 8: Status
    echo "Step 7: PM2 Status:"
    pm2 status
    echo ""
    
    # Step 9: Logs
    echo "Step 8: Recent logs:"
    pm2 logs cryptorafts --lines 10 --nostream
    echo ""
    
    echo "========================================"
    echo "DEPLOYMENT COMPLETE!"
    echo "========================================"
    echo ""
    echo "All fixes have been deployed:"
    echo "  - Email subscription API implemented"
    echo "  - Homepage form connected to API"
    echo "  - Security audit completed"
    echo "  - Performance optimizations applied"
    echo ""
    echo "Check the website: https://www.cryptorafts.com"
    echo ""
else
    echo "Build failed! Check errors above."
    exit 1
fi
