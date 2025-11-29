#!/bin/bash
# Check CSS/JS Assets

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "CHECKING CSS/JS ASSETS"
echo "=========================================="
echo ""

CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)

if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
    
    echo "CSS File: $CSS_BASENAME"
    echo "URL: $CSS_URL"
    echo ""
    echo "Headers:"
    curl -I "$CSS_URL" 2>&1 | grep -i "content-type\|http/"
    echo ""
    echo "Content (first 100 chars):"
    curl -s "$CSS_URL" 2>&1 | head -c 100
    echo ""
    echo ""
fi

if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
    
    echo "JS File: $JS_BASENAME"
    echo "URL: $JS_URL"
    echo ""
    echo "Headers:"
    curl -I "$JS_URL" 2>&1 | grep -i "content-type\|http/"
    echo ""
    echo "Content (first 100 chars):"
    curl -s "$JS_URL" 2>&1 | head -c 100
    echo ""
    echo ""
fi

echo "=========================================="
echo "CHECK COMPLETE"
echo "=========================================="

