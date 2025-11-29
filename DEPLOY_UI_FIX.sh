#!/bin/bash

# ==========================================
# DEPLOY UI FIX - REBUILD WITH FIXED LAYOUT
# ==========================================
# This script:
# 1. Stops PM2
# 2. Cleans build cache
# 3. Rebuilds with fixed UI layout
# 4. Restarts PM2
# 5. Verifies everything
# ==========================================

set -e

APP_NAME="cryptorafts"
APP_DIR="/var/www/cryptorafts"

echo "=========================================="
echo "DEPLOY UI FIX - REBUILD WITH FIXED LAYOUT"
echo "=========================================="
echo ""

cd "$APP_DIR" || exit 1
echo "✅ Working directory: $(pwd)"
echo ""

# ==========================================
# STEP 1: STOP PM2
# ==========================================

echo "Step 1: Stopping PM2..."
echo "----------------------------------------"

pm2 stop "$APP_NAME" 2>/dev/null || echo "⚠️  PM2 process not running"
sleep 2
echo "✅ PM2 stopped"
echo ""

# ==========================================
# STEP 2: CLEAN BUILD CACHE
# ==========================================

echo "Step 2: Cleaning build cache..."
echo "----------------------------------------"

rm -rf .next/cache
rm -rf .next/static
rm -f .next/lock
echo "✅ Build cache cleaned"
echo ""

# ==========================================
# STEP 3: REBUILD APPLICATION
# ==========================================

echo "Step 3: Rebuilding application..."
echo "----------------------------------------"

echo "A. Installing dependencies (if needed)..."
npm install --legacy-peer-deps --production=false
echo "✅ Dependencies installed"
echo ""

echo "B. Building application..."
echo "This may take a few minutes..."
npm run build
echo "✅ Build completed"
echo ""

# ==========================================
# STEP 4: RESTART PM2
# ==========================================

echo "Step 4: Restarting PM2..."
echo "----------------------------------------"

if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save
echo "✅ PM2 restarted and saved"
echo ""

# Wait for app to start
echo "Waiting for application to start..."
sleep 10
echo "✅ Wait complete"
echo ""

# ==========================================
# STEP 5: VERIFY DEPLOYMENT
# ==========================================

echo "Step 5: Verifying deployment..."
echo "----------------------------------------"

# Check PM2 Status
echo "A. Checking PM2 Status..."
pm2 status "$APP_NAME"
echo ""

# Check if port is listening
echo "B. Checking if port 3000 is listening..."
if netstat -tuln | grep -q ":3000"; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is NOT listening"
    exit 1
fi
echo ""

# Test localhost response
echo "C. Testing localhost response..."
LOCALHOST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$LOCALHOST_RESPONSE" = "200" ]; then
    echo "✅ Localhost responding with 200 OK"
else
    echo "❌ Localhost responding with HTTP $LOCALHOST_RESPONSE"
    exit 1
fi
echo ""

# Check for content
echo "D. Checking for content in HTML..."
if curl -s http://localhost:3000/ 2>/dev/null | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Content is present in HTML"
else
    echo "⚠️  Content may be missing from HTML"
fi
echo ""

# Check for hero content visibility
echo "E. Checking for hero content visibility..."
if curl -s http://localhost:3000/ 2>/dev/null | grep -q "The AI-Powered Web3 Ecosystem"; then
    echo "✅ Hero content is present in HTML"
else
    echo "⚠️  Hero content may be missing from HTML"
fi
echo ""

# Check Nginx status
echo "F. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl start nginx
    echo "✅ Nginx started"
fi
echo ""

# Test HTTPS response
echo "G. Testing HTTPS response..."
HTTPS_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost/ 2>/dev/null || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ HTTPS responding with 200 OK"
else
    echo "⚠️  HTTPS responding with HTTP $HTTPS_RESPONSE"
fi
echo ""

echo "=========================================="
echo "UI FIX DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "✅ Application rebuilt with fixed UI layout"
echo "✅ PM2 restarted and running"
echo "✅ Port 3000 is listening"
echo "✅ Application is responding"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo "4. Check browser console (F12) for any errors"
echo ""

