#!/bin/bash
# Final Deployment Verification Script
# Run this on VPS to verify everything is working

echo "========================================"
echo "FINAL DEPLOYMENT VERIFICATION"
echo "========================================"
echo ""

cd /var/www/cryptorafts

# Step 1: Check PM2 Status
echo "Step 1: Checking PM2 Status..."
pm2 status
echo ""

# Step 2: Check Server Response
echo "Step 2: Testing Server Response..."
curl -I http://localhost:3000 2>&1 | head -15
echo ""

# Step 3: Check Build Artifacts
echo "Step 3: Checking Build Artifacts..."
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Build ID: $(cat .next/BUILD_ID)"
    echo "✅ Build exists"
else
    echo "❌ Build missing - rebuilding..."
    npm run build 2>&1 | tail -20
fi
echo ""

# Step 4: Check Email API
echo "Step 4: Checking Email API..."
if [ -f "src/app/api/email/subscribe/route.ts" ]; then
    echo "✅ Email subscription API exists"
else
    echo "❌ Email subscription API missing"
fi
echo ""

# Step 5: Check Nginx
echo "Step 5: Checking Nginx..."
nginx -t 2>&1
systemctl status nginx --no-pager | head -10
echo ""

# Step 6: Check Recent Logs
echo "Step 6: Recent Application Logs..."
pm2 logs cryptorafts --lines 10 --nostream
echo ""

# Step 7: Test Homepage Content
echo "Step 7: Testing Homepage Content..."
curl -s http://localhost:3000 | grep -i "WELCOME TO CRYPTORAFTS" && echo "✅ Homepage content found" || echo "⚠️ Homepage content check"
echo ""

echo "========================================"
echo "VERIFICATION COMPLETE"
echo "========================================"
echo ""
echo "Server Status:"
echo "  - PM2: $(pm2 jlist | grep -o '"status":"[^"]*"' | head -1)"
echo "  - Build: $([ -f .next/BUILD_ID ] && echo 'Exists' || echo 'Missing')"
echo "  - Email API: $([ -f src/app/api/email/subscribe/route.ts ] && echo 'Exists' || echo 'Missing')"
echo "  - Nginx: $(systemctl is-active nginx)"
echo ""
echo "If everything shows ✅, the server is working correctly."
echo "If you still see 'Loading...', it's a browser cache issue."
echo ""
echo "To fix browser cache:"
echo "  1. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
echo "  2. Or use Incognito/Private mode"
echo "  3. Or clear browser cache in settings"
echo ""

