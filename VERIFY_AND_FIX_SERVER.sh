#!/bin/bash
# ============================================
# CRYPTORAFTS - VERIFY AND FIX SERVER
# Checks if server is accessible and fixes issues
# ============================================

cd /var/www/cryptorafts

echo ""
echo "🔍 VERIFYING SERVER STATUS..."
echo "===================================="
echo ""

# Check PM2 status
echo "📋 PM2 Status:"
pm2 status
echo ""

# Check if port 3000 is listening
echo "📋 Port 3000 Status:"
if netstat -tuln | grep -q ':3000 '; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is NOT listening"
fi
echo ""

# Test local server
echo "📋 Testing local server (http://127.0.0.1:3000):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Local server responding (HTTP $HTTP_CODE)"
else
    echo "❌ Local server NOT responding (HTTP $HTTP_CODE)"
    echo "📋 Checking PM2 logs..."
    pm2 logs cryptorafts --lines 20 --nostream
fi
echo ""

# Check Nginx status
echo "📋 Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    echo "📋 Testing Nginx proxy (https://www.cryptorafts.com):"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://www.cryptorafts.com || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Nginx proxy responding (HTTP $HTTP_CODE)"
    else
        echo "❌ Nginx proxy NOT responding (HTTP $HTTP_CODE)"
    fi
else
    echo "❌ Nginx is NOT running"
    echo "📋 Starting Nginx..."
    systemctl start nginx
fi
echo ""

# Check Nginx config
echo "📋 Checking Nginx configuration:"
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    nginx -t
fi
echo ""

# Restart services if needed
echo "📋 Restarting services..."
pm2 restart cryptorafts
systemctl reload nginx

echo ""
echo "✅ VERIFICATION COMPLETE"
echo "===================================="
echo ""
echo "📋 Final Status:"
pm2 status
echo ""
echo "📋 Test URLs:"
echo "  Local: http://127.0.0.1:3000"
echo "  Public: https://www.cryptorafts.com"
echo ""

