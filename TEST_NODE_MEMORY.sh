#!/bin/bash

# ============================================
# TEST NODE.JS MEMORY SETTINGS
# ============================================

echo "=========================================="
echo "🧪 TESTING NODE.JS MEMORY SETTINGS"
echo "=========================================="
echo ""

APP_DIR="/var/www/cryptorafts"
cd "$APP_DIR" || exit 1

# Test 1: Without NODE_OPTIONS
echo "[1/3] Testing Node.js heap WITHOUT NODE_OPTIONS..."
node -e "console.log('Heap Limit (default):', require('v8').getHeapStatistics().heap_size_limit / 1024 / 1024, 'MB')"
echo ""

# Test 2: With NODE_OPTIONS
echo "[2/3] Testing Node.js heap WITH NODE_OPTIONS..."
NODE_OPTIONS='--max-old-space-size=2048' node -e "console.log('Heap Limit (with NODE_OPTIONS):', require('v8').getHeapStatistics().heap_size_limit / 1024 / 1024, 'MB')"
echo ""

# Test 3: Check running process
echo "[3/3] Checking running process..."
PID=$(pm2 pid cryptorafts)
if [ ! -z "$PID" ]; then
    echo "Process ID: $PID"
    echo "Process command:"
    ps aux | grep $PID | grep -v grep
    echo ""
    echo "Environment variables:"
    cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -i node || echo "No NODE_OPTIONS found in process"
else
    echo "❌ App is not running!"
fi
echo ""

echo "=========================================="
echo "✅ TEST COMPLETE"
echo "=========================================="
echo ""
echo "📊 Expected Results:"
echo "   - Default heap: ~512-1024 MB"
echo "   - With NODE_OPTIONS: ~2048 MB"
echo "   - If running process shows NODE_OPTIONS: Fix is working"
echo "=========================================="

