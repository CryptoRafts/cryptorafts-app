#!/bin/bash
# ============================================
# SEARCH AND FIX ALL - Complete Solution
# ============================================

set -e

echo "========================================"
echo "🔍 SEARCHING FOR FILES EVERYWHERE"
echo "========================================"
echo ""

# Search more thoroughly
echo "🔍 Searching for package.json in entire system..."
find /var/www /home /opt /root -name "package.json" -type f 2>/dev/null | while read f; do
    DIR=$(dirname "$f")
    echo "Found: $f"
    if [ -f "$DIR/src/app/page.tsx" ]; then
        echo "✅ This looks like the app directory: $DIR"
        ls -la "$DIR" | head -10
        echo ""
        echo "Do you want to copy from $DIR to /var/www/cryptorafts? (y/n)"
        read -t 5 answer || answer="y"
        if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
            echo "Copying files..."
            mkdir -p /var/www/cryptorafts
            cd "$DIR"
            cp -r src package.json next.config.js tsconfig.json public /var/www/cryptorafts/ 2>/dev/null || true
            chown -R root:root /var/www/cryptorafts
            chmod -R 755 /var/www/cryptorafts
            echo "✅ Files copied!"
        fi
    fi
done

# Check for files in common hosting directories
echo ""
echo "🔍 Checking common hosting directories..."

# Check domains directory
if [ -d "/home/*/domains" ]; then
    echo "Checking /home/*/domains..."
    find /home -path "*/domains/*/public_html" -type d 2>/dev/null | while read d; do
        if [ -f "$d/package.json" ]; then
            echo "Found in: $d"
            ls -la "$d/package.json" "$d/src/app/page.tsx" 2>/dev/null || true
        fi
    done
fi

# Check public_html
find /home -name "public_html" -type d 2>/dev/null | while read d; do
    if [ -f "$d/package.json" ]; then
        echo "Found in: $d"
        ls -la "$d/package.json" "$d/src/app/page.tsx" 2>/dev/null || true
    fi
done

echo ""
echo "========================================"
echo "🔍 FINAL CHECK: /var/www/cryptorafts"
echo "========================================"
cd /var/www/cryptorafts

if [ -f "package.json" ] && [ -d "src" ]; then
    echo "✅ Files found in /var/www/cryptorafts!"
    ls -la package.json src/app/page.tsx next.config.js
    echo ""
    echo "Proceeding with deployment..."
else
    echo "❌ Files still NOT in /var/www/cryptorafts"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 FILES MUST BE UPLOADED VIA FILE MANAGER!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "1. Go to: https://hpanel.hostinger.com/"
    echo "2. Click 'File Manager'"
    echo "3. Navigate to: /var/www/cryptorafts"
    echo "   (NOT /home, NOT /domains, NOT /public_html)"
    echo "4. Upload ONLY these files from C:\\Users\\dell\\cryptorafts-starter:"
    echo "   ✅ src/ folder (ENTIRE folder)"
    echo "   ✅ package.json (file)"
    echo "   ✅ next.config.js (file)"
    echo "   ✅ tsconfig.json (file)"
    echo "   ✅ public/ folder (if exists)"
    echo ""
    echo "5. After upload, verify in File Manager:"
    echo "   - You should see 'src' folder"
    echo "   - You should see 'package.json' file"
    echo ""
    echo "6. Then run this script again"
    exit 1
fi

