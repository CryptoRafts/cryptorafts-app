#!/bin/bash
# ============================================
# CHECK WHAT'S IN /var/www/cryptorafts
# ============================================

echo "🔍 CHECKING /var/www/cryptorafts"
echo "================================"
echo ""

cd /var/www/cryptorafts || {
    echo "❌ ERROR: /var/www/cryptorafts not found!"
    exit 1
}

echo "📁 Current directory: $(pwd)"
echo ""
echo "📋 Files in /var/www/cryptorafts:"
echo "----------------------------------"
ls -la
echo ""

echo "📋 Checking for critical files:"
echo "----------------------------------"
[ -f "package.json" ] && echo "✅ package.json exists" || echo "❌ package.json NOT FOUND"
[ -f "src/app/page.tsx" ] && echo "✅ src/app/page.tsx exists" || echo "❌ src/app/page.tsx NOT FOUND"
[ -f "next.config.js" ] && echo "✅ next.config.js exists" || echo "❌ next.config.js NOT FOUND"
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ CRITICAL: Files are NOT uploaded!"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 YOU MUST UPLOAD FILES VIA HOSTINGER FILE MANAGER!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "STEP 1: Go to: https://hpanel.hostinger.com/"
    echo "STEP 2: Click 'File Manager'"
    echo "STEP 3: Navigate to: /var/www/cryptorafts"
    echo "STEP 4: Upload from C:\Users\dell\cryptorafts-starter:"
    echo "   - src/ folder (ENTIRE folder)"
    echo "   - package.json"
    echo "   - next.config.js"
    echo "   - tsconfig.json"
    echo "   - public/ folder"
    echo "STEP 5: After uploading, run this script again!"
    echo ""
    exit 1
fi

echo "✅ Files found! Ready for deployment!"

