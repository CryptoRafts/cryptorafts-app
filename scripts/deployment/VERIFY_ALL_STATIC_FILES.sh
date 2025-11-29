#!/bin/bash

# ============================================
# VERIFY ALL STATIC FILES REFERENCED IN HTML
# ============================================

echo "=========================================="
echo "🔍 VERIFYING ALL STATIC FILES"
echo "=========================================="
echo ""

cd /var/www/cryptorafts || exit 1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Get HTML and extract all static file references
echo "1. Extracting static file references from HTML:"
echo ""
STATIC_FILES=$(curl -s http://127.0.0.1:3000/ | grep -o '_next/static/[^"]*' | sort -u)
echo "$STATIC_FILES"
echo ""

# 2. Check each file
echo "2. Checking if each file exists:"
echo ""
MISSING=0
TOTAL=0

while IFS= read -r file; do
    if [ -n "$file" ]; then
        TOTAL=$((TOTAL + 1))
        # Remove leading slash if present
        file=$(echo "$file" | sed 's|^/||')
        # Check if file exists
        if [ -f ".next/$file" ]; then
            echo -e "${GREEN}✅ $file${NC}"
        else
            echo -e "${RED}❌ $file (MISSING)${NC}"
            MISSING=$((MISSING + 1))
        fi
    fi
done <<< "$STATIC_FILES"

echo ""
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo "Total files referenced: $TOTAL"
echo "Missing files: $MISSING"
echo ""

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ All static files exist!${NC}"
    echo ""
    echo "The issue might be:"
    echo "1. Browser cache (try hard refresh: Ctrl+Shift+R)"
    echo "2. Service worker cache"
    echo "3. CDN cache"
    echo "4. Browser extension blocking scripts"
else
    echo -e "${RED}❌ $MISSING files are missing${NC}"
    echo ""
    echo "This is the problem! Missing files need to be rebuilt."
fi

echo ""
echo "3. Testing public URL static files:"
echo ""
# Test a few key files
KEY_FILES=$(echo "$STATIC_FILES" | head -5)
for file in $KEY_FILES; do
    if [ -n "$file" ]; then
        file=$(echo "$file" | sed 's|^/||')
        echo "Testing: https://www.cryptorafts.com/$file"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.cryptorafts.com/$file" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "  ${GREEN}✅ HTTP $HTTP_CODE${NC}"
        else
            echo -e "  ${RED}❌ HTTP $HTTP_CODE${NC}"
        fi
    fi
done

echo ""
echo "=========================================="

