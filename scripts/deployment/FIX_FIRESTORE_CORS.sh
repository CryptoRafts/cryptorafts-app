#!/bin/bash

# ============================================
# FIX FIRESTORE CORS ERRORS
# ============================================
# This script diagnoses and provides fixes for Firestore CORS/403 errors

echo "============================================"
echo "FIXING FIRESTORE CORS ERRORS"
echo "============================================"
echo ""

# Check if app is running
echo "[1/5] Checking PM2 status..."
pm2 list | grep -q cryptorafts
if [ $? -eq 0 ]; then
    echo "✅ App is running"
else
    echo "❌ App is not running"
    exit 1
fi

# Check environment variables
echo ""
echo "[2/5] Checking Firebase environment variables..."
if [ -f /var/www/cryptorafts/.env.local ]; then
    echo "✅ .env.local exists"
    if grep -q "NEXT_PUBLIC_FIREBASE" /var/www/cryptorafts/.env.local; then
        echo "✅ Firebase config found in .env.local"
    else
        echo "⚠️  Firebase config not found in .env.local (using hardcoded config)"
    fi
else
    echo "❌ .env.local not found"
fi

# Check Firebase connectivity
echo ""
echo "[3/5] Testing Firebase connectivity..."
curl -s -o /dev/null -w "%{http_code}" https://firestore.googleapis.com/v1/projects/cryptorafts-b9067/databases | grep -q "200\|401\|403"
if [ $? -eq 0 ]; then
    echo "✅ Can reach Firestore API"
else
    echo "⚠️  Cannot reach Firestore API (may be normal)"
fi

# Check domain authorization
echo ""
echo "[4/5] Checking domain configuration..."
echo "⚠️  IMPORTANT: www.cryptorafts.com must be added to Firebase Console"
echo ""
echo "To fix CORS errors, you need to:"
echo "1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings"
echo "2. Scroll to 'Authorized domains'"
echo "3. Add: www.cryptorafts.com"
echo "4. Add: cryptorafts.com (if not already there)"
echo "5. Save changes"
echo ""

# Restart app
echo "[5/5] Restarting app..."
pm2 restart cryptorafts
if [ $? -eq 0 ]; then
    echo "✅ App restarted"
else
    echo "❌ Failed to restart app"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ DIAGNOSTIC COMPLETE"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Add www.cryptorafts.com to Firebase Console authorized domains"
echo "2. Wait 1-2 minutes for changes to propagate"
echo "3. Refresh your browser"
echo ""
echo "If issues persist, check:"
echo "- pm2 logs cryptorafts"
echo "- Browser console for specific error messages"
echo ""

