#!/bin/bash

# ============================================
# OPTIMIZE FOR PERFECT PERFORMANCE
# ============================================

echo "=========================================="
echo "🚀 OPTIMIZING FOR PERFECT PERFORMANCE"
echo "=========================================="
echo ""

APP_DIR="/var/www/cryptorafts"
cd "$APP_DIR" || exit 1

# Step 1: Update PM2 config with optimal settings
echo "[1/4] Updating PM2 configuration for optimal performance..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './start-server.sh',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
      NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '2G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs']
  }]
};
EOF
echo "✅ Configuration optimized"
echo ""

# Step 2: Update wrapper script
echo "[2/4] Updating wrapper script..."
cat > start-server.sh << 'EOF'
#!/bin/bash
export NODE_OPTIONS='--max-old-space-size=2048 --optimize-for-size'
cd /var/www/cryptorafts
exec env NODE_OPTIONS='--max-old-space-size=2048 --optimize-for-size' node server.js
EOF

chmod +x start-server.sh
echo "✅ Wrapper script optimized"
echo ""

# Step 3: Restart with optimized config
echo "[3/4] Restarting with optimized configuration..."
pm2 stop cryptorafts 2>/dev/null || true
pm2 delete cryptorafts 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
sleep 5
echo "✅ App restarted with optimizations"
echo ""

# Step 4: Verify optimizations
echo "[4/4] Verifying optimizations..."
pm2 status
echo ""
PID=$(pm2 pid cryptorafts)
echo "Process ID: $PID"
echo "NODE_OPTIONS:"
cat /proc/$PID/environ | tr '\0' '\n' | grep NODE_OPTIONS
echo ""

echo "=========================================="
echo "✅ OPTIMIZATION COMPLETE!"
echo "=========================================="
echo ""
echo "📊 Optimizations Applied:"
echo "   ✅ Heap Size: 2048 MB"
echo "   ✅ Optimize for Size: Enabled"
echo "   ✅ Auto-restart: Enabled"
echo "   ✅ Memory Limit: 2GB"
echo ""
echo "🎉 Your app is now optimized for perfect performance!"
echo ""
echo "📝 Monitor:"
echo "   pm2 monit         - Real-time monitoring"
echo "   pm2 status       - Check status"
echo "   pm2 logs cryptorafts - View logs"
echo "=========================================="

