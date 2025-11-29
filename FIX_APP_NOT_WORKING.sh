#!/bin/bash

# ============================================
# FIX APP NOT WORKING - Comprehensive Fix
# ============================================

echo "=========================================="
echo "🔧 FIXING APP NOT WORKING"
echo "=========================================="
echo ""

APP_DIR="/var/www/cryptorafts"
cd "$APP_DIR" || exit 1

# Step 1: Check if app is responding
echo "[1/8] Testing application response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ App is responding (HTTP $HTTP_CODE)"
else
    echo "❌ App is NOT responding (HTTP $HTTP_CODE)"
fi
echo ""

# Step 2: Check if port is listening
echo "[2/8] Checking if port 3000 is listening..."
if netstat -tlnp 2>/dev/null | grep -q ":3000" || ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ Port 3000 is listening"
    netstat -tlnp 2>/dev/null | grep ":3000" || ss -tlnp 2>/dev/null | grep ":3000"
else
    echo "❌ Port 3000 is NOT listening"
fi
echo ""

# Step 3: Check recent errors
echo "[3/8] Checking recent errors..."
ERRORS=$(pm2 logs cryptorafts --err --lines 20 --nostream 2>/dev/null | tail -10)
if [ ! -z "$ERRORS" ]; then
    echo "⚠️ Recent errors found:"
    echo "$ERRORS"
else
    echo "✅ No recent errors"
fi
echo ""

# Step 4: Check process
echo "[4/8] Checking process status..."
PID=$(pm2 pid cryptorafts)
if [ ! -z "$PID" ]; then
    echo "✅ Process is running (PID: $PID)"
    if ps aux | grep -q "$PID" && ! grep -q "defunct" < <(ps aux | grep "$PID"); then
        echo "✅ Process is active"
    else
        echo "❌ Process is not active"
    fi
else
    echo "❌ Process is NOT running"
fi
echo ""

# Step 5: Check firewall
echo "[5/8] Checking firewall..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status 2>/dev/null | head -1)
    echo "Firewall status: $UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "active"; then
        if ufw status | grep -q "3000"; then
            echo "✅ Port 3000 is allowed"
        else
            echo "⚠️ Port 3000 might be blocked"
            echo "Run: ufw allow 3000/tcp"
        fi
    fi
fi
echo ""

# Step 6: Restart application
echo "[6/8] Restarting application..."
pm2 stop cryptorafts 2>/dev/null || true
sleep 2
pm2 start cryptorafts
sleep 5
echo "✅ App restarted"
echo ""

# Step 7: Test again
echo "[7/8] Testing application again..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ App is now responding (HTTP $HTTP_CODE)"
else
    echo "❌ App is still NOT responding (HTTP $HTTP_CODE)"
fi
echo ""

# Step 8: Check logs
echo "[8/8] Checking recent logs..."
echo "Output logs (last 10 lines):"
pm2 logs cryptorafts --out --lines 10 --nostream 2>/dev/null | tail -10
echo ""
echo "Error logs (last 10 lines):"
pm2 logs cryptorafts --err --lines 10 --nostream 2>/dev/null | tail -10
echo ""

echo "=========================================="
echo "✅ DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "   - HTTP Response: $HTTP_CODE"
echo "   - Process: $(if [ ! -z "$PID" ]; then echo "Running"; else echo "Not running"; fi)"
echo "   - Port 3000: $(if netstat -tlnp 2>/dev/null | grep -q ":3000" || ss -tlnp 2>/dev/null | grep -q ":3000"; then echo "Listening"; else echo "Not listening"; fi)"
echo ""
echo "📝 Next steps:"
echo "   1. Check logs above for errors"
echo "   2. Test from browser: http://72.61.98.99:3000"
echo "   3. Check firewall: ufw allow 3000/tcp"
echo "   4. Check Nginx config (if using reverse proxy)"
echo "=========================================="

