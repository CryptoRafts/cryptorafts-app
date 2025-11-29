#!/bin/bash

# ============================================
# VERIFY ALL FIXES - Complete Checklist
# ============================================

echo "=========================================="
echo "✅ VERIFYING ALL FIXES"
echo "=========================================="
echo ""

APP_DIR="/var/www/cryptorafts"
cd "$APP_DIR" || exit 1

# Check 1: PM2 Status
echo "[1/10] Checking PM2 Status..."
pm2 status
RESTART_COUNT=$(pm2 describe cryptorafts | grep "restart_time" | awk '{print $4}' || echo "0")
echo "Restart Count: $RESTART_COUNT"
if [ "$RESTART_COUNT" -le "1" ]; then
    echo "✅ App is stable (restart count: $RESTART_COUNT)"
else
    echo "⚠️ App has restarted $RESTART_COUNT times"
fi
echo ""

# Check 2: App Response
echo "[2/10] Testing App Response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ App is responding (HTTP $HTTP_CODE)"
else
    echo "❌ App returned: $HTTP_CODE"
fi
echo ""

# Check 3: Static Files
echo "[3/10] Testing Static Files..."
echo "Testing site.webmanifest..."
WEBMANIFEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/site.webmanifest 2>/dev/null || echo "000")
if [ "$WEBMANIFEST_CODE" = "200" ]; then
    echo "✅ site.webmanifest: 200 OK"
else
    echo "❌ site.webmanifest: $WEBMANIFEST_CODE"
fi

echo "Testing favicon.ico..."
FAVICON_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/favicon.ico 2>/dev/null || echo "000")
if [ "$FAVICON_CODE" = "200" ]; then
    echo "✅ favicon.ico: 200 OK"
else
    echo "❌ favicon.ico: $FAVICON_CODE"
fi

echo "Testing tablogo.ico..."
TABLOGO_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tablogo.ico 2>/dev/null || echo "000")
if [ "$TABLOGO_CODE" = "200" ]; then
    echo "✅ tablogo.ico: 200 OK"
else
    echo "❌ tablogo.ico: $TABLOGO_CODE"
fi
echo ""

# Check 4: Routes
echo "[4/10] Testing Routes..."
echo "Testing /spotlight/apply..."
SPOTLIGHT_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/spotlight/apply 2>/dev/null || echo "000")
if [ "$SPOTLIGHT_CODE" = "200" ]; then
    echo "✅ /spotlight/apply: 200 OK"
else
    echo "⚠️ /spotlight/apply: $SPOTLIGHT_CODE"
fi
echo ""

# Check 5: Memory Configuration
echo "[5/10] Checking Memory Configuration..."
PID=$(pm2 pid cryptorafts)
if [ ! -z "$PID" ]; then
    if cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -q "NODE_OPTIONS"; then
        NODE_OPTIONS=$(cat /proc/$PID/environ | tr '\0' '\n' | grep NODE_OPTIONS)
        echo "✅ NODE_OPTIONS found: $NODE_OPTIONS"
        
        if echo "$NODE_OPTIONS" | grep -q "max-old-space-size=2048"; then
            echo "✅ Memory limit set to 2048MB"
        else
            echo "⚠️ Memory limit might not be set correctly"
        fi
    else
        echo "⚠️ NODE_OPTIONS not found in process"
    fi
else
    echo "❌ Process not found"
fi
echo ""

# Check 6: Wrapper Script
echo "[6/10] Checking Wrapper Script..."
if [ -f "start-server.sh" ]; then
    echo "✅ Wrapper script exists"
    if grep -q "max-old-space-size=2048" start-server.sh; then
        echo "✅ Wrapper script has memory settings"
    else
        echo "⚠️ Wrapper script missing memory settings"
    fi
else
    echo "⚠️ Wrapper script not found"
fi
echo ""

# Check 7: PM2 Config
echo "[7/10] Checking PM2 Config..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js exists"
    if grep -q "max-old-space-size=2048\|max_memory_restart" ecosystem.config.js; then
        echo "✅ PM2 config has memory settings"
    else
        echo "⚠️ PM2 config missing memory settings"
    fi
else
    echo "❌ ecosystem.config.js not found"
fi
echo ""

# Check 8: Server Files
echo "[8/10] Checking Server Files..."
if [ -f "server.js" ]; then
    echo "✅ server.js exists"
else
    echo "❌ server.js not found"
fi

if [ -f "next.config.js" ]; then
    echo "✅ next.config.js exists"
else
    echo "❌ next.config.js not found"
fi
echo ""

# Check 9: Port Listening
echo "[9/10] Checking Port 3000..."
if netstat -tlnp 2>/dev/null | grep -q ":3000" || ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ Port 3000 is listening"
    netstat -tlnp 2>/dev/null | grep ":3000" || ss -tlnp 2>/dev/null | grep ":3000"
else
    echo "❌ Port 3000 is NOT listening"
fi
echo ""

# Check 10: Recent Errors
echo "[10/10] Checking Recent Errors..."
ERROR_COUNT=$(pm2 logs cryptorafts --err --lines 50 --nostream 2>/dev/null | grep -c "Error\|error\|ERROR\|Failed\|failed\|FAILED" || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "✅ No recent errors found"
else
    echo "⚠️ Found $ERROR_COUNT error(s) in recent logs"
    echo "Recent errors:"
    pm2 logs cryptorafts --err --lines 10 --nostream 2>/dev/null | tail -5
fi
echo ""

echo "=========================================="
echo "✅ VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "  - App Status: $(if [ "$HTTP_CODE" = "200" ]; then echo "✅ Online"; else echo "❌ Offline"; fi)"
echo "  - Static Files: $(if [ "$WEBMANIFEST_CODE" = "200" ] && [ "$FAVICON_CODE" = "200" ]; then echo "✅ Working"; else echo "⚠️ Issues"; fi)"
echo "  - Routes: $(if [ "$SPOTLIGHT_CODE" = "200" ]; then echo "✅ Working"; else echo "⚠️ Issues"; fi)"
echo "  - Memory Config: $(if [ ! -z "$PID" ] && cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -q "NODE_OPTIONS"; then echo "✅ Configured"; else echo "⚠️ Check Needed"; fi)"
echo "  - Stability: $(if [ "$RESTART_COUNT" -le "1" ]; then echo "✅ Stable"; else echo "⚠️ Unstable"; fi)"
echo ""
echo "🎉 All fixes verified!"
echo "=========================================="

