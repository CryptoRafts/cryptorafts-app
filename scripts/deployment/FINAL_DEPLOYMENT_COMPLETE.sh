#!/bin/bash
# Final Complete Deployment Script
# This script deploys the fixed code with forced client-side rendering

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FINAL COMPLETE DEPLOYMENT"
echo "=========================================="
echo ""

# Step 1: Stop PM2
echo "1. Stopping PM2..."
pm2 stop cryptorafts || echo "⚠️  Process not running"
echo "✅ PM2 stopped"
echo ""

# Step 2: Clean Everything
echo "2. Cleaning build cache and old build..."
rm -rf .next/cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ Cache cleaned"
echo ""

# Step 3: Verify Source Files
echo "3. Verifying source files..."
if [ -f "src/app/page.tsx" ]; then
    echo "   ✅ page.tsx exists"
    if grep -q "'use client'" src/app/page.tsx; then
        echo "   ✅ Client component directive found"
    else
        echo "   ⚠️  Client component directive NOT found"
    fi
    if grep -q "isMounted" src/app/page.tsx; then
        echo "   ✅ Mounting check found"
    else
        echo "   ⚠️  Mounting check NOT found"
    fi
else
    echo "   ❌ page.tsx not found!"
    exit 1
fi

if [ -f "src/app/HomePageClient.tsx" ]; then
    echo "   ✅ HomePageClient.tsx exists"
else
    echo "   ❌ HomePageClient.tsx not found!"
    exit 1
fi
echo ""

# Step 4: Install Dependencies (if needed)
echo "4. Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "   Installing dependencies..."
    npm ci --production=false
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 5: Build Application
echo "5. Building application with fixes..."
echo "   This may take a few minutes..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed! Check errors above"
    exit 1
fi
echo ""

# Step 6: Verify Build Output
echo "6. Verifying build output..."
if [ -f ".next/BUILD_ID" ]; then
    BUILD_ID=$(cat .next/BUILD_ID)
    echo "   ✅ Build ID: $BUILD_ID"
else
    echo "   ❌ Build ID not found!"
    exit 1
fi

if [ -d ".next/server" ]; then
    echo "   ✅ Server build exists"
    SERVER_FILES=$(find .next/server -name "*.js" 2>/dev/null | wc -l)
    echo "   ✅ Server files: $SERVER_FILES"
else
    echo "   ❌ Server build NOT found!"
    exit 1
fi

if [ -d ".next/static" ]; then
    echo "   ✅ Static build exists"
    CSS_FILES=$(find .next/static/css -name "*.css" 2>/dev/null | wc -l)
    JS_FILES=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l)
    echo "   ✅ CSS files: $CSS_FILES"
    echo "   ✅ JS chunks: $JS_FILES"
else
    echo "   ❌ Static build NOT found!"
    exit 1
fi
echo ""

# Step 7: Restart PM2
echo "7. Restarting PM2..."
pm2 restart cryptorafts || pm2 start npm --name cryptorafts -- start

if [ $? -eq 0 ]; then
    echo "✅ PM2 restarted"
else
    echo "❌ Failed to restart PM2!"
    exit 1
fi
echo ""

# Step 8: Wait for Server
echo "8. Waiting for server to be ready..."
sleep 5

MAX_RETRIES=10
RETRY_COUNT=0
SERVER_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ | grep -q "200"; then
        SERVER_READY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ "$SERVER_READY" = true ]; then
    echo "✅ Server is responding"
else
    echo "⚠️  Server may not be ready yet"
fi
echo ""

# Step 9: Verify Server Response
echo "9. Verifying server response..."
LOCAL_RESPONSE=$(curl -sI http://127.0.0.1:3000/ 2>&1 | head -1)
echo "   Local server: $LOCAL_RESPONSE"

if echo "$LOCAL_RESPONSE" | grep -q "200"; then
    echo "   ✅ Server responding with 200 OK"
    
    # Check HTML content
    LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
    HTML_SIZE=$(echo "$LOCAL_HTML" | wc -c)
    echo "   HTML size: $HTML_SIZE bytes"
    
    if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
        echo "   ✅ Hero content found in HTML"
        echo "   ✅ DEPLOYMENT SUCCESSFUL!"
    else
        echo "   ⚠️  Hero content NOT found in HTML"
        echo "   ⚠️  Check PM2 logs: pm2 logs cryptorafts"
    fi
    
    if echo "$LOCAL_HTML" | grep -q "__NEXT_DATA__"; then
        echo "   ✅ __NEXT_DATA__ found in HTML"
    else
        echo "   ⚠️  __NEXT_DATA__ NOT found in HTML"
    fi
else
    echo "   ❌ Server not responding correctly"
    echo "   Check PM2 logs: pm2 logs cryptorafts"
fi
echo ""

# Step 10: Check PM2 Status
echo "10. PM2 Status:"
pm2 status cryptorafts
echo ""

# Step 11: Check PM2 Logs (last 10 lines)
echo "11. Recent PM2 Logs:"
pm2 logs cryptorafts --lines 10 --nostream 2>&1 | tail -10
echo ""

echo "=========================================="
echo "DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Test in incognito browser: https://www.cryptorafts.com"
echo "2. Check browser console (F12) for any errors"
echo "3. Verify full page content renders correctly"
echo "4. If issues persist, check:"
echo "   - PM2 logs: pm2 logs cryptorafts"
echo "   - Nginx logs: tail -f /var/log/nginx/error.log"
echo "   - Nginx config: ./NGINX_CONFIG_CHECK.sh"
echo ""







