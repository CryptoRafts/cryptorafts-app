#!/bin/bash

# ============================================
# CHECK NGINX & PUBLIC URL
# ============================================

echo "=========================================="
echo "🌐 CHECKING NGINX & PUBLIC URL"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check Nginx status
echo "1. Nginx Status:"
systemctl status nginx --no-pager | head -10
echo ""

# 2. Check Nginx configuration
echo "2. Nginx Configuration:"
if [ -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    echo -e "${GREEN}✅ Config file exists${NC}"
    echo ""
    echo "Config content:"
    cat /etc/nginx/sites-enabled/cryptorafts
else
    echo -e "${RED}❌ Config file not found${NC}"
    echo "Looking for config files:"
    ls -la /etc/nginx/sites-enabled/
fi
echo ""

# 3. Test Nginx syntax
echo "3. Nginx Configuration Test:"
nginx -t
echo ""

# 4. Check Nginx error logs
echo "4. Nginx Error Logs (last 20 lines):"
tail -20 /var/log/nginx/error.log 2>/dev/null || echo "Cannot read error log"
echo ""

# 5. Check Nginx access logs
echo "5. Nginx Access Logs (last 10 lines):"
tail -10 /var/log/nginx/access.log 2>/dev/null || echo "Cannot read access log"
echo ""

# 6. Test public URL
echo "6. Testing Public URL:"
echo "Testing https://www.cryptorafts.com/ ..."
PUBLIC_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://www.cryptorafts.com/ 2>/dev/null || echo "000")
echo "HTTP Code: $PUBLIC_CODE"
if [ "$PUBLIC_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Public URL responding${NC}"
    echo ""
    echo "Response headers:"
    curl -I https://www.cryptorafts.com/ 2>/dev/null | head -20
else
    echo -e "${RED}❌ Public URL not responding correctly${NC}"
    echo ""
    echo "Full response:"
    curl -v https://www.cryptorafts.com/ 2>&1 | head -30
fi
echo ""

# 7. Test static files
echo "7. Testing Static Files:"
STATIC_CHUNK=$(ls .next/static/chunks/*.js 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "")
if [ -n "$STATIC_CHUNK" ]; then
    echo "Testing: https://www.cryptorafts.com/_next/static/chunks/$STATIC_CHUNK"
    STATIC_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.cryptorafts.com/_next/static/chunks/$STATIC_CHUNK" 2>/dev/null || echo "000")
    echo "HTTP Code: $STATIC_CODE"
    if [ "$STATIC_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Static file accessible${NC}"
    else
        echo -e "${RED}❌ Static file not accessible${NC}"
    fi
else
    echo "No static chunks found to test"
fi
echo ""

# 8. Check upstream connection
echo "8. Testing Upstream Connection:"
echo "Testing http://127.0.0.1:3000/ from server..."
UPSTREAM_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null || echo "000")
if [ "$UPSTREAM_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Upstream (Node.js) responding${NC}"
else
    echo -e "${RED}❌ Upstream not responding${NC}"
fi
echo ""

# 9. Check if Nginx can reach upstream
echo "9. Nginx Upstream Test:"
if grep -q "proxy_pass" /etc/nginx/sites-enabled/cryptorafts 2>/dev/null; then
    echo -e "${GREEN}✅ proxy_pass found in config${NC}"
    grep "proxy_pass" /etc/nginx/sites-enabled/cryptorafts
else
    echo -e "${RED}❌ proxy_pass not found in config${NC}"
fi
echo ""

# 10. Summary
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo ""
if [ "$PUBLIC_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Public URL is working${NC}"
else
    echo -e "${RED}❌ Public URL is NOT working (HTTP $PUBLIC_CODE)${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Nginx not proxying to port 3000"
    echo "2. Nginx config has wrong upstream"
    echo "3. SSL certificate issues"
    echo "4. Firewall blocking port 443"
fi
echo ""

