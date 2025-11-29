#!/bin/bash

# ============================================
# 🚀 CRYPTORAFTS - DEPLOY NOW SCRIPT
# ============================================
# Run this on your Hostinger VPS to deploy

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🚀 CRYPTORAFTS - DEPLOY NOW TO HOSTINGER VPS 🚀       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

APP_DIR="/var/www/cryptorafts"

# Check if we're in the right directory
if [ ! -f "next.config.vps.js" ]; then
    echo "❌ Error: next.config.vps.js not found!"
    echo "Make sure you're in the application directory: $APP_DIR"
    exit 1
fi

echo "✅ Starting deployment..."
echo ""

# Step 1: Switch to VPS config
echo "[1/6] Switching to VPS configuration..."
cp next.config.vps.js next.config.js
echo "✅ VPS config activated"

# Step 2: Install dependencies
echo ""
echo "[2/6] Installing dependencies..."
npm install --production
echo "✅ Dependencies installed"

# Step 3: Build application
echo ""
echo "[3/6] Building application..."
npm run build
echo "✅ Build complete"

# Step 4: Create logs directory
echo ""
echo "[4/6] Setting up logs..."
mkdir -p logs
echo "✅ Logs directory ready"

# Step 5: Start with PM2
echo ""
echo "[5/6] Starting with PM2..."

# Check if already running
if pm2 describe cryptorafts > /dev/null 2>&1; then
    echo "Restarting existing application..."
    pm2 restart cryptorafts
else
    echo "Starting new application..."
    pm2 start ecosystem.config.js
fi

pm2 save
echo "✅ Application started with PM2"

# Step 6: Check status
echo ""
echo "[6/6] Checking status..."
pm2 status

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              🎉 DEPLOYMENT COMPLETE! 🎉                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Your application is running!"
echo ""
echo "Next steps:"
echo "1. Setup SSL: sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com"
echo "2. Add domain to Firebase Authorized Domains"
echo "3. Test: https://www.cryptorafts.com"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check status"
echo "  pm2 logs cryptorafts - View logs"
echo "  pm2 restart cryptorafts - Restart app"
echo ""

