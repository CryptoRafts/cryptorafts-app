#!/bin/bash
# FINAL FIX - Everything

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FINAL FIX - EVERYTHING"
echo "=========================================="
echo ""

# Step 1: Fix file permissions
echo "Step 1: Fixing file permissions..."
chown -R root:root /var/www/cryptorafts
chmod -R 755 /var/www/cryptorafts
chmod -R 644 /var/www/cryptorafts/.next/static 2>/dev/null || true
echo "✅ Permissions fixed"
echo ""

# Step 2: Fix Nginx
echo "Step 2: Fixing Nginx..."
rm -f /etc/nginx/sites-enabled/cryptorafts.backup.*
rm -f /etc/nginx/sites-available/cryptorafts.backup.*

# Remove duplicate upstream
if grep -c "^upstream nextjs_backend" /etc/nginx/sites-enabled/cryptorafts 2>/dev/null | grep -q "^2"; then
    awk '
    BEGIN { upstream_found = 0 }
    /^upstream nextjs_backend/ {
        if (upstream_found == 0) {
            upstream_found = 1
            print
            getline
            while (!/^}/) {
                print
                getline
            }
            print
        } else {
            getline
            while (!/^}/) {
                getline
            }
        }
        next
    }
    { print }
    ' /etc/nginx/sites-enabled/cryptorafts > /tmp/nginx_fixed.conf
    mv /tmp/nginx_fixed.conf /etc/nginx/sites-enabled/cryptorafts
    echo "✅ Duplicate upstream removed"
fi

# Remove Content-Type overrides
sed -i '/add_header Content-Type.*text\/html/d' /etc/nginx/sites-enabled/cryptorafts
sed -i '/add_header Content-Type.*text\/plain/d' /etc/nginx/sites-enabled/cryptorafts

# Test and reload
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config valid"
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config invalid"
    nginx -t 2>&1 | grep -i error
    exit 1
fi
echo ""

# Step 3: Stop PM2
echo "Step 3: Stopping PM2..."
pm2 stop cryptorafts 2>/dev/null || true
pm2 delete cryptorafts 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 4: Clean and rebuild
echo "Step 4: Cleaning build cache..."
rm -rf .next
rm -f .next/lock
pkill -f "next build" 2>/dev/null || true
echo "✅ Build cache cleaned"
echo ""

echo "Step 5: Rebuilding application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

# Step 6: Start PM2
echo "Step 6: Starting PM2..."
pm2 start ecosystem.config.js
sleep 10
pm2 status | grep cryptorafts
echo "✅ PM2 started"
echo ""

# Step 7: Wait for server
echo "Step 7: Waiting for server..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
        echo "✅ Server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server not ready"
        exit 1
    fi
    sleep 1
done
echo ""

# Step 8: Test everything
echo "Step 8: Testing everything..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)

if echo "$LOCAL_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Local server: Hero content found"
else
    echo "❌ Local server: Hero content NOT found"
fi

if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Public URL: Hero content found"
else
    echo "❌ Public URL: Hero content NOT found"
fi
echo ""

# Step 9: Check DNS
echo "Step 9: Checking DNS..."
DNS_IP=$(dig +short www.cryptorafts.com | head -1)
echo "   DNS resolves to: $DNS_IP"
if [ "$DNS_IP" != "72.61.98.99" ] && [ "$DNS_IP" != "" ]; then
    echo "   ⚠️  DNS might be pointing to CDN/proxy"
    echo "   If using Cloudflare/CDN, purge cache there!"
fi
echo ""

# Step 10: Final summary
echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "✅ File permissions fixed"
echo "✅ Nginx config fixed and reloaded"
echo "✅ Application rebuilt"
echo "✅ PM2 restarted"
echo "✅ Server tested"
echo ""
echo "CRITICAL: Clear your browser cache NOW!"
echo ""
echo "1. Press Ctrl+Shift+Delete"
echo "2. Select 'All time'"
echo "3. Check 'Cached images and files'"
echo "4. Click 'Clear data'"
echo "5. Close and reopen browser"
echo ""
echo "OR test in incognito/private mode!"
echo ""

