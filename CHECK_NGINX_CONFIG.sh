#!/bin/bash

# ============================================
# CHECK NGINX CONFIGURATION
# ============================================

echo "=========================================="
echo "🔍 CHECKING NGINX CONFIGURATION"
echo "=========================================="
echo ""

# Check 1: Nginx config files
echo "[1/4] Checking Nginx config files..."
if [ -f "/etc/nginx/sites-available/cryptorafts" ]; then
    echo "✅ Config file found: /etc/nginx/sites-available/cryptorafts"
    echo "Content:"
    cat /etc/nginx/sites-available/cryptorafts
elif [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    echo "✅ Config file found: /etc/nginx/sites-enabled/cryptorafts"
    echo "Content:"
    cat /etc/nginx/sites-enabled/cryptorafts
else
    echo "⚠️ No Nginx config found for cryptorafts"
    echo "Checking default config..."
    ls -la /etc/nginx/sites-enabled/
fi
echo ""

# Check 2: Test Nginx config
echo "[2/4] Testing Nginx configuration..."
nginx -t
echo ""

# Check 3: Test localhost proxy
echo "[3/4] Testing localhost proxy..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Nginx proxy is working (HTTP $HTTP_CODE)"
else
    echo "⚠️ Nginx proxy returned: $HTTP_CODE"
fi
echo ""

# Check 4: Test direct app access
echo "[4/4] Testing direct app access..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ App is working (HTTP $HTTP_CODE)"
else
    echo "❌ App returned: $HTTP_CODE"
fi
echo ""

echo "=========================================="
echo "✅ CHECK COMPLETE"
echo "=========================================="
echo ""
echo "📝 If Nginx proxy is not configured:"
echo "   1. Create config file: /etc/nginx/sites-available/cryptorafts"
echo "   2. Add proxy_pass to localhost:3000"
echo "   3. Create symlink: ln -s /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/"
echo "   4. Test: nginx -t"
echo "   5. Reload: systemctl reload nginx"
echo "=========================================="

