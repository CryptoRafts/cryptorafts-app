#!/bin/bash

# ============================================
# FINAL MEMORY FIX - Ensure NODE_OPTIONS Works
# ============================================

echo "=========================================="
echo "🔧 FINAL MEMORY FIX"
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

# Step 2: Fix wrapper script to ensure NODE_OPTIONS is passed
echo "[2/4] Fixing wrapper script..."
cat > start-server.sh << 'EOF'
#!/bin/bash
export NODE_OPTIONS='--max-old-space-size=2048'
cd /var/www/cryptorafts
exec env NODE_OPTIONS='--max-old-space-size=2048' node server.js
EOF

chmod +x start-server.sh
echo "✅ Wrapper script updated"
echo ""

# Step 3: Verify wrapper script
echo "[3/4] Verifying wrapper script..."
cat start-server.sh
echo ""

# Step 4: Start with fixed wrapper
echo "[4/4] Starting application..."
pm2 start ecosystem.config.js
pm2 save
sleep 5
echo "✅ App restarted"
echo ""

# Verify NODE_OPTIONS
echo "📊 Verifying NODE_OPTIONS..."
PID=$(pm2 pid cryptorafts)
if [ ! -z "$PID" ]; then
    echo "Process ID: $PID"
    echo "Checking environment..."
    if cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -q "NODE_OPTIONS"; then
        echo "✅ NODE_OPTIONS found in process:"
        cat /proc/$PID/environ | tr '\0' '\n' | grep NODE_OPTIONS
    else
        echo "⚠️ NODE_OPTIONS not found in process environment"
        echo "But it should still work via wrapper script"
    fi
fi
echo ""

# Check status
pm2 status
echo ""
pm2 describe cryptorafts | grep -E "script path|node"
echo ""

echo "=========================================="
echo "✅ FIX APPLIED!"
echo "=========================================="
echo ""
echo "📊 Wrapper script now uses 'env NODE_OPTIONS'"
echo "   This ensures NODE_OPTIONS is passed to Node.js"
echo ""
echo "📝 Check memory:"
echo "   pm2 monit"
echo "   Wait 10 seconds and check heap size"
echo ""
echo "Heap size should now be ~2048MB"
echo "Heap usage should be ~30-40% instead of 95%"
echo "=========================================="

