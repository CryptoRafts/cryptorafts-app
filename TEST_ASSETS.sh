#!/bin/bash
# Test CSS/JS Assets

cd /var/www/cryptorafts || exit 1

echo "Testing CSS/JS Assets..."
echo ""

sleep 2

CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)

if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
    
    echo "CSS File: $CSS_BASENAME"
    echo "URL: $CSS_URL"
    CSS_HEADERS=$(curl -I "$CSS_URL" 2>&1 | head -5)
    echo "$CSS_HEADERS"
    echo ""
fi

if [ -n "$JS_FILE" ]; then
    JS_BASENAME=$(basename "$JS_FILE")
    JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
    
    echo "JS File: $JS_BASENAME"
    echo "URL: $JS_URL"
    JS_HEADERS=$(curl -I "$JS_URL" 2>&1 | head -5)
    echo "$JS_HEADERS"
    echo ""
fi

echo "Test complete!"

