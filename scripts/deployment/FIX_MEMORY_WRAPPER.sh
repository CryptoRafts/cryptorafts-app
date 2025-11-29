#!/bin/bash

# ============================================
# FIX MEMORY USING WRAPPER SCRIPT
# ============================================
# This creates a wrapper script to ensure NODE_OPTIONS is set

echo "=========================================="
echo "🔧 FIXING MEMORY WITH WRAPPER SCRIPT"
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

# Step 2: Create wrapper script
echo "[2/5] Creating wrapper script..."
cat > start-server.sh << 'EOF'
#!/bin/bash
export NODE_OPTIONS='--max-old-space-size=2048'
cd /var/www/cryptorafts
exec node server.js
EOF

chmod +x start-server.sh
echo "✅ Wrapper script created"
echo ""

# Step 3: Update ecosystem.config.js to use wrapper
echo "[3/5] Updating PM2 config to use wrapper..."
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
      NODE_OPTIONS: '--max-old-space-size=2048'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '2G',
    min_uptime: '10s',
    max_restarts: 10
  }]
};
EOF
echo "✅ PM2 config updated"
echo ""

# Step 4: Verify files
echo "[4/5] Verifying files..."
if [ -f "start-server.sh" ] && [ -x "start-server.sh" ]; then
    echo "✅ Wrapper script exists and is executable"
else
    echo "❌ Wrapper script not found!"
    exit 1
fi

if grep -q "max-old-space-size=2048" start-server.sh; then
    echo "✅ Memory setting found in wrapper"
else
    echo "❌ Memory setting NOT found in wrapper!"
    exit 1
fi
echo ""

# Step 5: Start with wrapper
echo "[5/5] Starting application with wrapper..."
pm2 start ecosystem.config.js
pm2 save
sleep 5
echo "✅ App restarted"
echo ""

# Check status
echo "📊 Application Status:"
pm2 status
echo ""

# Check process args
echo "📊 Process Arguments:"
ps aux | grep "start-server.sh\|cryptorafts" | grep -v grep | head -2
echo ""

echo "=========================================="
echo "✅ MEMORY FIX APPLIED!"
echo "=========================================="
echo ""
echo "📊 New Configuration:"
echo "   - Using wrapper script: start-server.sh"
echo "   - NODE_OPTIONS: --max-old-space-size=2048"
echo "   - Heap Size: Should be ~2048MB"
echo ""
echo "⚠️  Wait 10 seconds and check:"
echo "   pm2 monit"
echo "   pm2 describe cryptorafts"
echo ""
echo "Heap size should now be ~2048MB instead of 80MB"
echo "Heap usage should drop from 95% to ~30-40%"
echo "=========================================="

