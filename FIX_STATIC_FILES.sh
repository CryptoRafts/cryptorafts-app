#!/bin/bash

# ============================================
# FIX STATIC FILES ISSUE
# ============================================

echo "=========================================="
echo "🔧 FIXING STATIC FILES ISSUE"
echo "=========================================="
echo ""

cd /var/www/cryptorafts || exit 1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check what static files exist
echo "1. Checking static files:"
echo ""
echo "Files in .next/static/chunks/:"
ls -la .next/static/chunks/ | head -10
echo ""

# 2. Find actual chunk files
echo "2. Finding actual chunk files:"
CHUNK_FILE=$(find .next/static/chunks -name "*.js" -type f | head -1)
if [ -n "$CHUNK_FILE" ]; then
    echo "Found chunk file: $CHUNK_FILE"
    CHUNK_NAME=$(basename "$CHUNK_FILE")
    CHUNK_DIR=$(dirname "$CHUNK_FILE" | sed 's|^\.next/static||')
    echo "Chunk name: $CHUNK_NAME"
    echo "Chunk directory: $CHUNK_DIR"
    echo ""
    echo "Testing path: https://www.cryptorafts.com/_next/static$CHUNK_DIR/$CHUNK_NAME"
    curl -I "https://www.cryptorafts.com/_next/static$CHUNK_DIR/$CHUNK_NAME" 2>/dev/null | head -5
else
    echo -e "${RED}❌ No chunk files found${NC}"
fi
echo ""

# 3. Check build ID
echo "3. Checking build ID:"
if [ -f ".next/BUILD_ID" ]; then
    BUILD_ID=$(cat .next/BUILD_ID)
    echo "Build ID: $BUILD_ID"
    echo ""
    echo "Testing: https://www.cryptorafts.com/_next/static/chunks/webpack-$BUILD_ID.js"
    curl -I "https://www.cryptorafts.com/_next/static/chunks/webpack-$BUILD_ID.js" 2>/dev/null | head -5
else
    echo -e "${RED}❌ BUILD_ID not found${NC}"
fi
echo ""

# 4. Test what Next.js actually serves
echo "4. Testing what Next.js serves locally:"
echo "Testing http://127.0.0.1:3000/_next/static/chunks/..."
curl -I "http://127.0.0.1:3000/_next/static/chunks/" 2>/dev/null | head -10
echo ""

# 5. Check actual HTML response
echo "5. Checking HTML for script tags:"
curl -s "http://127.0.0.1:3000/" | grep -o '_next/static/[^"]*' | head -5
echo ""

# 6. List all static files
echo "6. All static files structure:"
find .next/static -type f -name "*.js" -o -type f -name "*.css" | head -10
echo ""

# 7. Test a specific file
echo "7. Testing specific files:"
if [ -f ".next/static/chunks/webpack.js" ]; then
    echo "Testing webpack.js:"
    curl -I "https://www.cryptorafts.com/_next/static/chunks/webpack.js" 2>/dev/null | head -5
fi

if [ -f ".next/static/chunks/main.js" ]; then
    echo "Testing main.js:"
    curl -I "https://www.cryptorafts.com/_next/static/chunks/main.js" 2>/dev/null | head -5
fi

echo ""
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo ""
echo "The issue is that static files are returning 404."
echo "This means the browser can't load JavaScript bundles."
echo ""
echo "Next steps:"
echo "1. Check what files actually exist in .next/static/"
echo "2. Test the correct path"
echo "3. Make sure Nginx is proxying /_next/static/ correctly"
echo ""

