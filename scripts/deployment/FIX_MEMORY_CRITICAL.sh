#!/bin/bash

# ============================================
# CRITICAL MEMORY FIX - VPS Script
# ============================================
# This fixes the high heap usage issue

echo "=========================================="
echo "🔧 CRITICAL MEMORY FIX"
echo "=========================================="
echo ""

APP_DIR="/var/www/cryptorafts"
cd "$APP_DIR" || exit 1

# Step 1: Stop app
echo "[1/5] Stopping application..."
pm2 stop cryptorafts 2>/dev/null || true
pm2 delete cryptorafts 2>/dev/null || true
echo "✅ App stopped"
echo ""

# Step 2: Update ecosystem.config.js with proper Node.js memory settings
echo "[2/5] Updating PM2 configuration with proper memory settings..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    node_args: '--max-old-space-size=2048',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
      NODE_OPTIONS: '--max-old-space-size=2048'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '2G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
EOF
echo "✅ Configuration updated with node_args and NODE_OPTIONS"
echo ""

# Step 3: Verify config file
echo "[3/5] Verifying configuration..."
if grep -q "max-old-space-size=2048" ecosystem.config.js; then
    echo "✅ Memory settings found in config"
else
    echo "❌ Memory settings NOT found!"
    exit 1
fi
echo ""

# Step 4: Start with new config
echo "[4/5] Starting application with increased memory..."
pm2 start ecosystem.config.js
pm2 save
sleep 5
echo "✅ App restarted"
echo ""

# Step 5: Check status and memory
echo "[5/5] Checking memory usage..."
pm2 status
echo ""
sleep 2
pm2 describe cryptorafts | grep -E "memory|node_args|NODE_OPTIONS" || true
echo ""

# Check heap size
echo "📊 Memory Status:"
pm2 monit --no-interaction &
sleep 3
pkill -f "pm2 monit"
echo ""

echo "=========================================="
echo "✅ MEMORY FIX APPLIED!"
echo "=========================================="
echo ""
echo "📊 New Settings:"
echo "   - node_args: --max-old-space-size=2048"
echo "   - NODE_OPTIONS: --max-old-space-size=2048"
echo "   - max_memory_restart: 2G"
echo ""
echo "⚠️  Wait 10 seconds and check:"
echo "   pm2 describe cryptorafts"
echo "   pm2 monit"
echo ""
echo "Heap size should now be ~2048MB instead of 72MB"
echo "=========================================="

