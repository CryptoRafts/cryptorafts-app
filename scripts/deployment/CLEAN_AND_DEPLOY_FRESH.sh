#!/bin/bash

# ============================================
# CLEAN VPS AND DEPLOY FRESH FILES
# ============================================

set -e

VPS_USER="root"
VPS_IP="72.61.98.99"
VPS_PATH="/var/www/cryptorafts"

echo "============================================"
echo "🧹 CLEANING VPS AND DEPLOYING FRESH FILES"
echo "============================================"
echo ""

# Step 1: Stop PM2
echo "[1/10] Stopping PM2..."
ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH} && pm2 stop cryptorafts || true"
echo "✅ PM2 stopped"

# Step 2: Clean old build files
echo ""
echo "[2/10] Cleaning old build files..."
ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH} && rm -rf .next node_modules/.cache .next/cache 2>/dev/null || true"
echo "✅ Old build files cleaned"

# Step 3: Clean old logs
echo ""
echo "[3/10] Cleaning old logs..."
ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH} && rm -rf logs/*.log 2>/dev/null || true && mkdir -p logs"
echo "✅ Old logs cleaned"

# Step 4: Keep .env.local (important!)
echo ""
echo "[4/10] Preserving .env.local..."
ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH} && cp .env.local .env.local.backup 2>/dev/null || true"
echo "✅ .env.local backed up"

# Step 5: Upload fresh page.tsx
echo ""
echo "[5/10] Uploading fresh page.tsx..."
scp src/app/page.tsx "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/app/page.tsx"
echo "✅ page.tsx uploaded"

# Step 6: Upload fresh components
echo ""
echo "[6/10] Uploading fresh components..."
scp src/components/SpotlightDisplay.tsx "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/components/SpotlightDisplay.tsx"
scp src/components/RealtimeStats.tsx "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/components/RealtimeStats.tsx"
scp src/components/ErrorBoundary.tsx "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/components/ErrorBoundary.tsx"
scp src/components/PerfectHeader.tsx "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/components/PerfectHeader.tsx"
echo "✅ Components uploaded"

# Step 7: Upload fresh config files
echo ""
echo "[7/10] Uploading fresh config files..."
scp next.config.js "${VPS_USER}@${VPS_IP}:${VPS_PATH}/next.config.js"
scp ecosystem.config.js "${VPS_USER}@${VPS_IP}:${VPS_PATH}/ecosystem.config.js"
scp src/lib/firebase.client.ts "${VPS_USER}@${VPS_IP}:${VPS_PATH}/src/lib/firebase.client.ts"
echo "✅ Config files uploaded"

# Step 8: Restore .env.local
echo ""
echo "[8/10] Restoring .env.local..."
ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH} && mv .env.local.backup .env.local 2>/dev/null || true"
echo "✅ .env.local restored"

# Step 9: Rebuild application
echo ""
echo "[9/10] Rebuilding application..."
echo "This may take 2-3 minutes..."
ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH} && npm run build 2>&1 | tail -50"
echo "✅ Build completed"

# Step 10: Restart PM2
echo ""
echo "[10/10] Restarting PM2..."
ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH} && pm2 delete cryptorafts 2>/dev/null || true && pm2 start ecosystem.config.js --update-env"
echo "✅ PM2 restarted"

echo ""
echo "============================================"
echo "✅ CLEAN AND DEPLOY COMPLETE!"
echo "============================================"
echo ""
echo "Your app is now fresh and clean at:"
echo "  https://www.cryptorafts.com"
echo ""
echo "IMPORTANT: Clear your browser cache!"
echo "  - Press Ctrl+Shift+R (hard refresh)"
echo "  - Or open in Incognito/Private mode"
echo ""

