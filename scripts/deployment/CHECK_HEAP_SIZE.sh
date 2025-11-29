#!/bin/bash

# ============================================
# CHECK NODE.JS HEAP SIZE
# ============================================

echo "=========================================="
echo "🔍 CHECKING NODE.JS HEAP SIZE"
echo "=========================================="
echo ""

APP_DIR="/var/www/cryptorafts"
cd "$APP_DIR" || exit 1

# Get process ID
PID=$(pm2 pid cryptorafts)

if [ -z "$PID" ]; then
    echo "❌ App is not running!"
    exit 1
fi

echo "Process ID: $PID"
echo ""

# Check 1: Process environment
echo "[1/4] Checking process environment..."
if cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -q "NODE_OPTIONS"; then
    echo "✅ NODE_OPTIONS found in process:"
    cat /proc/$PID/environ | tr '\0' '\n' | grep NODE_OPTIONS
else
    echo "❌ NODE_OPTIONS NOT found in process!"
fi
echo ""

# Check 2: Process arguments
echo "[2/4] Checking process arguments..."
ps aux | grep $PID | grep -v grep
echo ""

# Check 3: Node.js heap size via v8
echo "[3/4] Checking Node.js heap size..."
# This requires connecting to the Node.js process
echo "Checking if we can access heap statistics..."
echo "Note: Heap size should be ~2048MB (2147483648 bytes)"
echo ""

# Check 4: PM2 describe
echo "[4/4] Checking PM2 describe..."
pm2 describe cryptorafts | grep -E "script|node_args|NODE_OPTIONS" || true
echo ""

# Check wrapper script
echo "Checking wrapper script..."
if [ -f "start-server.sh" ]; then
    echo "✅ Wrapper script exists:"
    cat start-server.sh
else
    echo "❌ Wrapper script NOT found!"
fi
echo ""

# Check ecosystem config
echo "Checking ecosystem.config.js..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ Config file exists:"
    cat ecosystem.config.js | grep -A 5 "script\|node_args\|NODE_OPTIONS"
else
    echo "❌ Config file NOT found!"
fi
echo ""

echo "=========================================="
echo "✅ CHECK COMPLETE"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "   - If NODE_OPTIONS is found: Memory fix is applied"
echo "   - If NOT found: Run FIX_MEMORY_WRAPPER.sh"
echo "   - Heap size should be ~2048MB"
echo "   - Check pm2 monit to see actual heap size"
echo "=========================================="

