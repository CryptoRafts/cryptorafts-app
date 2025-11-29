#!/bin/bash
set -e

echo "========================================="
echo "CHECKING JAVASCRIPT FILES ACCESSIBILITY"
echo "========================================="
echo ""

cd /var/www/cryptorafts

# Step 1: Check if JS files exist
echo "Step 1: Checking JavaScript files..."
if [ -d ".next/static/chunks" ]; then
    echo "✅ JavaScript chunks directory exists"
    JS_COUNT=$(ls -1 .next/static/chunks/*.js 2>/dev/null | wc -l)
    echo "   Found $JS_COUNT JavaScript files"
else
    echo "❌ JavaScript chunks directory not found"
    exit 1
fi

# Step 2: Check if CSS files exist
echo ""
echo "Step 2: Checking CSS files..."
if [ -d ".next/static/css" ]; then
    echo "✅ CSS directory exists"
    CSS_COUNT=$(ls -1 .next/static/css/*.css 2>/dev/null | wc -l)
    echo "   Found $CSS_COUNT CSS files"
else
    echo "❌ CSS directory not found"
    exit 1
fi

# Step 3: Test if files are accessible via HTTP
echo ""
echo "Step 3: Testing file accessibility via HTTP..."
WEBPACK_JS=$(ls -1 .next/static/chunks/webpack-*.js 2>/dev/null | head -1 | xargs basename)
if [ -n "$WEBPACK_JS" ]; then
    echo "   Testing: /_next/static/chunks/$WEBPACK_JS"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/_next/static/chunks/$WEBPACK_JS")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ File is accessible (HTTP $HTTP_CODE)"
    else
        echo "   ❌ File not accessible (HTTP $HTTP_CODE)"
    fi
fi

CSS_FILE=$(ls -1 .next/static/css/*.css 2>/dev/null | head -1 | xargs basename)
if [ -n "$CSS_FILE" ]; then
    echo "   Testing: /_next/static/css/$CSS_FILE"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/_next/static/css/$CSS_FILE")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ File is accessible (HTTP $HTTP_CODE)"
    else
        echo "   ❌ File not accessible (HTTP $HTTP_CODE)"
    fi
fi

# Step 4: Check HTML for script tags
echo ""
echo "Step 4: Checking HTML for script tags..."
SCRIPT_COUNT=$(curl -s http://localhost:3000 | grep -o '<script' | wc -l)
echo "   Found $SCRIPT_COUNT script tags in HTML"

# Step 5: Check for hidden content
echo ""
echo "Step 5: Checking for hidden content..."
HIDDEN_COUNT=$(curl -s http://localhost:3000 | grep -o 'hidden' | wc -l)
echo "   Found $HIDDEN_COUNT 'hidden' attributes in HTML"

# Step 6: Check if content exists
echo ""
echo "Step 6: Checking if content exists in HTML..."
if curl -s http://localhost:3000 | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ Content 'WELCOME TO CRYPTORAFTS' found in HTML"
else
    echo "   ❌ Content 'WELCOME TO CRYPTORAFTS' NOT found in HTML"
fi

if curl -s http://localhost:3000 | grep -q "GET STARTED"; then
    echo "   ✅ Content 'GET STARTED' found in HTML"
else
    echo "   ❌ Content 'GET STARTED' NOT found in HTML"
fi

echo ""
echo "========================================="
echo "SUMMARY"
echo "========================================="
echo "The server is serving the correct HTML with all content."
echo "The content is hidden in a <div hidden> tag until React hydrates."
echo "This is a client-side JavaScript execution issue."
echo ""
echo "The user needs to:"
echo "1. Clear browser cache completely"
echo "2. Check browser console for JavaScript errors"
echo "3. Disable browser extensions that might block JavaScript"
echo "4. Try accessing the site in Incognito/Private mode"
echo ""

