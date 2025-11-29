#!/bin/bash

# ============================================
# FIX HIGH MEMORY USAGE - VPS Script
# ============================================

echo "=========================================="
echo "🔧 FIXING HIGH MEMORY USAGE"
echo "=========================================="
echo ""

APP_DIR="/var/www/cryptorafts"
cd "$APP_DIR" || exit 1

# Step 1: Stop app
echo "[1/4] Stopping application..."
pm2 stop cryptorafts 2>/dev/null || true
pm2 delete cryptorafts 2>/dev/null || true
echo "✅ App stopped"
echo ""

# Step 2: Update ecosystem.config.js with higher memory limit
echo "[2/4] Updating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
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
echo "✅ Configuration updated"
echo ""

# Step 3: Start with new config
echo "[3/4] Starting application with increased memory..."
pm2 start ecosystem.config.js
pm2 save
sleep 3
echo "✅ App restarted"
echo ""

# Step 4: Check status
echo "[4/4] Checking status..."
pm2 status
echo ""
pm2 describe cryptorafts | grep -E "memory|heap|restart"
echo ""

echo "=========================================="
echo "✅ FIX APPLIED!"
echo "=========================================="
echo ""
echo "📊 New Memory Limits:"
echo "   - Max Memory: 2GB"
echo "   - Node.js Heap: 2048MB"
echo "   - Auto-restart if exceeds limit"
echo ""
echo "📝 Monitor memory usage:"
echo "   pm2 monit"
echo "   pm2 describe cryptorafts"
echo "=========================================="

