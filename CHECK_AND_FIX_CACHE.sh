#!/bin/bash
# Check CDN/Proxy and Fix Cache Issues

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "CHECKING CDN/PROXY AND FIXING CACHE"
echo "=========================================="
echo ""

# Step 1: Check DNS
echo "Step 1: Checking DNS..."
DNS_IP=$(dig +short www.cryptorafts.com | head -1)
SERVER_IP="72.61.98.99"
echo "   DNS resolves to: $DNS_IP"
echo "   Server IP: $SERVER_IP"

if [ "$DNS_IP" != "$SERVER_IP" ] && [ "$DNS_IP" != "" ]; then
    echo "   ⚠️  CDN/PROXY DETECTED!"
    echo "   Your DNS is pointing to: $DNS_IP"
    echo "   This means you're using a CDN/proxy service"
    echo ""
    echo "   Common CDN services:"
    echo "   - Cloudflare (usually shows cloudflare.com in whois)"
    echo "   - AWS CloudFront"
    echo "   - Other CDN services"
    echo ""
    
    # Check if it's Cloudflare
    WHOIS_RESULT=$(whois www.cryptorafts.com 2>/dev/null | grep -i "cloudflare\|nameserver" | head -3)
    if echo "$WHOIS_RESULT" | grep -qi "cloudflare"; then
        echo "   ✅ CLOUDFLARE DETECTED!"
        echo ""
        echo "   TO FIX CLOUDFLARE CACHE:"
        echo "   1. Go to: https://dash.cloudflare.com"
        echo "   2. Select your domain: cryptorafts.com"
        echo "   3. Go to: Caching → Purge Everything"
        echo "   4. Click: 'Purge Everything'"
        echo "   5. Wait 1-2 minutes"
        echo "   6. Clear your browser cache"
        echo ""
    else
        echo "   ⚠️  CDN detected but not Cloudflare"
        echo "   Check your CDN provider's dashboard to purge cache"
        echo ""
    fi
else
    echo "   ✅ No CDN detected - direct to server"
fi
echo ""

# Step 2: Add cache-busting headers to Nginx
echo "Step 2: Adding cache-busting headers to Nginx..."
if [ ! -f "/etc/nginx/sites-enabled/cryptorafts" ]; then
    echo "   ❌ Nginx config not found"
    exit 1
fi

# Backup config
cp /etc/nginx/sites-enabled/cryptorafts /etc/nginx/sites-enabled/cryptorafts.backup.$(date +%s)

# Add cache-busting headers for HTML
if ! grep -q "add_header Cache-Control.*no-cache" /etc/nginx/sites-enabled/cryptorafts; then
    # Add to location / block
    sed -i '/location \/ {/,/^[[:space:]]*}/ {
        /proxy_pass http:\/\/nextjs_backend;/a\
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;\
        add_header Pragma "no-cache" always;\
        add_header Expires "0" always;
    }' /etc/nginx/sites-enabled/cryptorafts
    echo "   ✅ Cache-busting headers added for HTML"
else
    echo "   ✅ Cache-busting headers already present"
fi

# Test and reload
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx config valid"
    systemctl reload nginx
    echo "   ✅ Nginx reloaded"
else
    echo "   ❌ Nginx config invalid"
    nginx -t 2>&1 | grep -i error
    # Restore backup
    mv /etc/nginx/sites-enabled/cryptorafts.backup.* /etc/nginx/sites-enabled/cryptorafts 2>/dev/null || true
    exit 1
fi
echo ""

# Step 3: Check for service workers
echo "Step 3: Checking for service workers..."
if [ -f "public/sw.js" ] || [ -f "public/service-worker.js" ]; then
    echo "   ⚠️  Service worker found"
    echo "   Service workers can cache content aggressively"
    echo "   Users need to unregister service worker in browser"
    echo ""
    echo "   TO FIX:"
    echo "   1. Open browser DevTools (F12)"
    echo "   2. Go to: Application → Service Workers"
    echo "   3. Click: 'Unregister' for any active workers"
    echo "   4. Go to: Application → Clear storage"
    echo "   5. Click: 'Clear site data'"
    echo ""
else
    echo "   ✅ No service worker found"
fi
echo ""

# Step 4: Test public URL with cache-busting
echo "Step 4: Testing public URL..."
PUBLIC_HTML=$(curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" "https://www.cryptorafts.com/?t=$(date +%s)" 2>&1)
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Hero content found in public URL"
    HERO_COUNT=$(echo "$PUBLIC_HTML" | grep -o "WELCOME TO CRYPTORAFTS" | wc -l)
    echo "   Found $HERO_COUNT occurrences"
else
    echo "   ❌ Hero content NOT found in public URL"
    echo "   This might be a CDN cache issue"
fi
echo ""

# Step 5: Check response headers
echo "Step 5: Checking response headers..."
HEADERS=$(curl -I "https://www.cryptorafts.com/" 2>&1 | head -15)
echo "   Response headers:"
echo "$HEADERS" | grep -i "cache-control\|pragma\|expires\|cf-\|cloudflare\|cdn"
if echo "$HEADERS" | grep -qi "cf-\|cloudflare"; then
    echo "   ✅ Cloudflare headers detected"
    echo "   You MUST purge Cloudflare cache!"
elif echo "$HEADERS" | grep -qi "cache-control.*max-age=0\|no-cache"; then
    echo "   ✅ Cache-busting headers present"
else
    echo "   ⚠️  No cache-busting headers detected"
fi
echo ""

# Step 6: Final instructions
echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "SUMMARY:"
echo "  ✅ Nginx cache-busting headers added"
echo "  ✅ Server tested"
echo ""
if [ "$DNS_IP" != "$SERVER_IP" ] && [ "$DNS_IP" != "" ]; then
    echo "  ⚠️  CDN/PROXY DETECTED: $DNS_IP"
    echo ""
    echo "CRITICAL: You MUST purge CDN cache!"
    echo ""
    if echo "$WHOIS_RESULT" | grep -qi "cloudflare" 2>/dev/null; then
        echo "CLOUDFLARE CACHE PURGE:"
        echo "1. Go to: https://dash.cloudflare.com"
        echo "2. Select: cryptorafts.com"
        echo "3. Go to: Caching → Purge Everything"
        echo "4. Click: 'Purge Everything'"
        echo "5. Wait 1-2 minutes"
    else
        echo "CDN CACHE PURGE:"
        echo "1. Log in to your CDN provider's dashboard"
        echo "2. Find 'Purge Cache' or 'Clear Cache' option"
        echo "3. Purge all cache"
        echo "4. Wait 1-2 minutes"
    fi
    echo ""
fi
echo "BROWSER CACHE CLEAR:"
echo "1. Press Ctrl+Shift+Delete"
echo "2. Select 'All time'"
echo "3. Check 'Cached images and files'"
echo "4. Check 'Cookies and other site data'"
echo "5. Click 'Clear data'"
echo "6. Close and reopen browser"
echo ""
echo "OR test in incognito/private mode!"
echo ""

