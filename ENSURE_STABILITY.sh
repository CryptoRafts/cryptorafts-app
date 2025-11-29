#!/bin/bash

# ============================================
# ENSURE APP STABILITY - Check and Fix
# ============================================

echo "=========================================="
echo "🔍 CHECKING APP STABILITY"
echo "=========================================="
echo ""

APP_DIR="/var/www/cryptorafts"
cd "$APP_DIR" || exit 1

# Step 1: Check restart reason
echo "[1/5] Checking restart reason..."
pm2 describe cryptorafts | grep -E "restart|uptime|created"
echo ""

# Step 2: Check recent errors
echo "[2/5] Checking recent errors..."
echo "Last 20 error lines:"
pm2 logs cryptorafts --err --lines 20 --nostream | tail -20
echo ""

# Step 3: Check memory usage
echo "[3/5] Checking memory usage..."
MEMORY=$(pm2 describe cryptorafts | grep "memory" | awk '{print $4}' || echo "N/A")
echo "Current Memory: $MEMORY"
echo "Memory Limit: 2GB"
echo ""

# Step 4: Check if NODE_OPTIONS is still applied
echo "[4/5] Verifying NODE_OPTIONS..."
PID=$(pm2 pid cryptorafts)
if [ ! -z "$PID" ]; then
    if cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -q "NODE_OPTIONS"; then
        echo "✅ NODE_OPTIONS is still applied:"
        cat /proc/$PID/environ | tr '\0' '\n' | grep NODE_OPTIONS
    else
        echo "❌ NODE_OPTIONS not found - need to restart"
    fi
else
    echo "❌ App is not running!"
fi
echo ""

# Step 5: Check application response
echo "[5/5] Testing application response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Application is responding (HTTP $HTTP_CODE)"
else
    echo "⚠️ Application returned: $HTTP_CODE"
fi
echo ""

echo "=========================================="
echo "✅ STABILITY CHECK COMPLETE"
echo "=========================================="
echo ""
echo "📊 Current Status:"
echo "   - Memory: $MEMORY"
echo "   - HTTP Status: $HTTP_CODE"
echo "   - NODE_OPTIONS: $(if [ ! -z "$PID" ] && cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -q "NODE_OPTIONS"; then echo "✅ Applied"; else echo "❌ Not found"; fi)"
echo ""
echo "📝 If app keeps restarting:"
echo "   1. Check error logs above"
echo "   2. Verify memory usage"
echo "   3. Check system resources"
echo "=========================================="

