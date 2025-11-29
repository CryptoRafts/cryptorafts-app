#!/bin/bash

# ============================================
# COMPLETE FIRESTORE DIAGNOSTIC
# ============================================

echo "============================================"
echo "COMPLETE FIRESTORE DIAGNOSTIC"
echo "============================================"
echo ""

# Check PM2 status
echo "[1/8] Checking PM2 status..."
pm2 list | grep -q cryptorafts
if [ $? -eq 0 ]; then
    PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="cryptorafts") | .status')
    echo "✅ App is running (Status: $PM2_STATUS)"
else
    echo "❌ App is not running"
    exit 1
fi

# Check environment variables
echo ""
echo "[2/8] Checking environment variables..."
if [ -f /var/www/cryptorafts/.env.local ]; then
    echo "✅ .env.local exists"
    if grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" /var/www/cryptorafts/.env.local; then
        API_KEY=$(grep "NEXT_PUBLIC_FIREBASE_API_KEY" /var/www/cryptorafts/.env.local | cut -d '=' -f2)
        echo "✅ Firebase API Key found: ${API_KEY:0:10}..."
    else
        echo "⚠️  Using hardcoded Firebase config"
    fi
else
    echo "⚠️  .env.local not found (using hardcoded config)"
fi

# Check Firebase API connectivity
echo ""
echo "[3/8] Testing Firebase API connectivity..."
FIREBASE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://firestore.googleapis.com/v1/projects/cryptorafts-b9067/databases" 2>&1)
if [ "$FIREBASE_RESPONSE" = "200" ] || [ "$FIREBASE_RESPONSE" = "401" ] || [ "$FIREBASE_RESPONSE" = "403" ]; then
    echo "✅ Can reach Firestore API (HTTP $FIREBASE_RESPONSE)"
else
    echo "⚠️  Cannot reach Firestore API (HTTP $FIREBASE_RESPONSE)"
fi

# Check PM2 logs for errors
echo ""
echo "[4/8] Checking PM2 logs for Firestore errors..."
RECENT_ERRORS=$(pm2 logs cryptorafts --lines 50 --nostream 2>&1 | grep -i "firestore\|cors\|403\|forbidden" | tail -5)
if [ -z "$RECENT_ERRORS" ]; then
    echo "✅ No recent Firestore errors in logs"
else
    echo "⚠️  Recent Firestore errors found:"
    echo "$RECENT_ERRORS"
fi

# Check if app is responding
echo ""
echo "[5/8] Testing app response..."
APP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>&1)
if [ "$APP_RESPONSE" = "200" ]; then
    echo "✅ App is responding (HTTP $APP_RESPONSE)"
else
    echo "⚠️  App response: HTTP $APP_RESPONSE"
fi

# Check Nginx proxy
echo ""
echo "[6/8] Testing Nginx proxy..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: www.cryptorafts.com" "http://localhost" 2>&1)
if [ "$NGINX_RESPONSE" = "200" ]; then
    echo "✅ Nginx proxy is working (HTTP $NGINX_RESPONSE)"
else
    echo "⚠️  Nginx proxy response: HTTP $NGINX_RESPONSE"
fi

# Check build files
echo ""
echo "[7/8] Checking build files..."
if [ -f /var/www/cryptorafts/.next/build-manifest.json ]; then
    echo "✅ Build manifest exists"
else
    echo "❌ Build manifest missing - rebuild required"
fi

# Check Firebase initialization
echo ""
echo "[8/8] Checking Firebase client configuration..."
if [ -f /var/www/cryptorafts/src/lib/firebase.client.ts ]; then
    echo "✅ Firebase client config exists"
    if grep -q "cryptorafts-b9067" /var/www/cryptorafts/src/lib/firebase.client.ts; then
        echo "✅ Firebase project ID configured correctly"
    else
        echo "⚠️  Firebase project ID may be incorrect"
    fi
else
    echo "❌ Firebase client config missing"
fi

echo ""
echo "============================================"
echo "DIAGNOSTIC COMPLETE"
echo "============================================"
echo ""
echo "🔍 Next steps to diagnose CORS issue:"
echo ""
echo "1. Check API Key restrictions in Google Cloud Console:"
echo "   https://console.cloud.google.com/apis/credentials?project=cryptorafts-b9067"
echo "   - Find API key: AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14"
echo "   - Check 'Application restrictions'"
echo "   - If 'HTTP referrers' is set, add:"
echo "     * https://www.cryptorafts.com/*"
echo "     * https://cryptorafts.com/*"
echo ""
echo "2. Check Firestore security rules:"
echo "   https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules"
echo "   - Verify spotlights collection has: allow read: if true;"
echo ""
echo "3. Check browser console for specific error:"
echo "   - Open: https://www.cryptorafts.com"
echo "   - Press F12"
echo "   - Check Console tab for exact error message"
echo ""
echo "4. Test Firestore directly from browser:"
echo "   - Open browser console"
echo "   - Run: fetch('https://firestore.googleapis.com/v1/projects/cryptorafts-b9067/databases/(default)/documents/spotlights?pageSize=1')"
echo "   - Check response"
echo ""

