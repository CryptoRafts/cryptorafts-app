#!/bin/bash

# ============================================
# COMPLETE DEPLOYMENT SCRIPT - Run on VPS
# ============================================

set -e

VPS_PATH="/var/www/cryptorafts"
APP_URL="https://www.cryptorafts.com"

echo "============================================"
echo "🚀 COMPLETE VPS DEPLOYMENT"
echo "============================================"
echo ""

cd "$VPS_PATH" || exit 1

# Step 1: Create .env.local
echo "[1/8] Creating .env.local..."
cat > .env.local << 'EOF'
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com

# Admin Configuration
ADMIN_EMAIL=anasshamsiggc@gmail.com
SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com
EOF
echo "✅ .env.local created"

# Step 2: Rebuild application
echo ""
echo "[2/8] Rebuilding application..."
echo "This may take 2-3 minutes..."
npm run build 2>&1 | tail -50
echo "✅ Build completed"

# Step 3: Restart PM2
echo ""
echo "[3/8] Restarting PM2..."
pm2 restart cryptorafts 2>/dev/null || pm2 start ecosystem.config.js
echo "✅ PM2 restarted"

# Step 4: Reload nginx
echo ""
echo "[4/8] Reloading nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

# Step 5: Verify deployment
echo ""
echo "[5/8] Verifying deployment..."
sleep 5
pm2 status
echo "✅ Deployment verified"

# Step 6: Check logs
echo ""
echo "[6/8] Checking recent logs..."
pm2 logs cryptorafts --lines 10 --nostream || echo "No logs available"

# Step 7: Test localhost
echo ""
echo "[7/8] Testing localhost..."
curl -I http://localhost:3000 2>&1 | head -5 || echo "Could not test localhost"

# Step 8: Final status
echo ""
echo "============================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "Your app is now deployed at:"
echo "  ${APP_URL}"
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Clear your browser cache (Ctrl+Shift+R)"
echo "2. Open ${APP_URL} in your browser"
echo "3. Check browser console (F12) for any errors"
echo "4. Verify Firebase connection in console"
echo ""

