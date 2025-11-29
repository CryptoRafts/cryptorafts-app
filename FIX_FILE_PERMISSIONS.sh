#!/bin/bash

# ==========================================
# FIX FILE PERMISSIONS - ALLOW NGINX TO READ
# ==========================================
# This script fixes file permissions so
# Nginx can read static assets
# ==========================================

set -e

APP_DIR="/var/www/cryptorafts"

echo "=========================================="
echo "FIX FILE PERMISSIONS - ALLOW NGINX TO READ"
echo "=========================================="
echo ""

cd "$APP_DIR" || exit 1
echo "✅ Working directory: $(pwd)"
echo ""

# ==========================================
# FIX PERMISSIONS
# ==========================================

echo "Fixing file permissions..."
echo "----------------------------------------"

# Fix ownership of .next directory
echo "A. Fixing ownership of .next directory..."
sudo chown -R www-data:www-data .next
echo "✅ Ownership fixed"
echo ""

# Fix permissions of .next directory
echo "B. Fixing permissions of .next directory..."
sudo chmod -R 755 .next
echo "✅ Permissions fixed"
echo ""

# Fix ownership of public directory
echo "C. Fixing ownership of public directory..."
if [ -d "public" ]; then
    sudo chown -R www-data:www-data public
    echo "✅ Public directory ownership fixed"
else
    echo "⚠️  Public directory not found"
fi
echo ""

# Fix permissions of public directory
echo "D. Fixing permissions of public directory..."
if [ -d "public" ]; then
    sudo chmod -R 755 public
    echo "✅ Public directory permissions fixed"
fi
echo ""

# Verify permissions
echo "E. Verifying permissions..."
echo "Checking .next/static permissions..."
ls -la .next/static/ | head -5
echo ""

# Test static asset accessibility
echo "F. Testing static asset accessibility..."
sleep 2
ASSET_TEST=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost/_next/static/css/5aa461682c405590.css 2>/dev/null || echo "000")
if [ "$ASSET_TEST" = "200" ]; then
    echo "✅ Static assets are now accessible via Nginx HTTPS"
elif [ "$ASSET_TEST" = "403" ]; then
    echo "⚠️  Still getting 403 - trying alternative permission fix..."
    sudo chmod -R 755 /var/www/cryptorafts/.next
    sudo chown -R www-data:www-data /var/www/cryptorafts/.next
    echo "✅ Alternative permission fix applied"
    sleep 2
    ASSET_TEST2=$(curl -s -k -o /dev/null -w "%{http_code}" https://localhost/_next/static/css/5aa461682c405590.css 2>/dev/null || echo "000")
    if [ "$ASSET_TEST2" = "200" ]; then
        echo "✅ Static assets are now accessible"
    else
        echo "⚠️  Still returning HTTP $ASSET_TEST2"
    fi
else
    echo "⚠️  Static assets returning HTTP $ASSET_TEST"
fi
echo ""

# Restart Nginx to clear any cached permissions
echo "G. Restarting Nginx..."
sudo systemctl restart nginx
echo "✅ Nginx restarted"
echo ""

echo "=========================================="
echo "FILE PERMISSIONS FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ File permissions fixed"
echo "✅ Nginx restarted"
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com"
echo "2. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo "4. Check browser console (F12) for any errors"
echo ""

