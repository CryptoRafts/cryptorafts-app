#!/bin/bash
# Check CSS and JS File Status - Verify HTTP 200

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "CHECKING CSS AND JS FILE STATUS"
echo "=========================================="
echo ""

# 1. Find CSS file
echo "Step 1: Finding CSS file..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1)
if [ -z "$CSS_FILE" ]; then
    echo "❌ CSS file not found!"
    exit 1
fi

CSS_BASENAME=$(basename "$CSS_FILE")
CSS_SIZE=$(wc -c < "$CSS_FILE")
echo "✅ CSS file found: $CSS_BASENAME"
echo "   Size: $CSS_SIZE bytes"
echo ""

# 2. Find JS file
echo "Step 2: Finding JS file..."
JS_FILE=$(ls .next/static/chunks/*.js 2>/dev/null | head -1)
if [ -z "$JS_FILE" ]; then
    echo "❌ JS file not found!"
    exit 1
fi

JS_BASENAME=$(basename "$JS_FILE")
JS_SIZE=$(wc -c < "$JS_FILE")
echo "✅ JS file found: $JS_BASENAME"
echo "   Size: $JS_SIZE bytes"
echo ""

# 3. Test local CSS accessibility
echo "Step 3: Testing local CSS accessibility..."
CSS_URL="http://127.0.0.1:3000/_next/static/css/$CSS_BASENAME"
CSS_RESPONSE=$(curl -sI "$CSS_URL" 2>&1)
CSS_STATUS=$(echo "$CSS_RESPONSE" | head -1 | grep -o "HTTP/[0-9.]* [0-9]*" | awk '{print $2}')

if [ "$CSS_STATUS" = "200" ]; then
    echo "✅ CSS accessible via local server (HTTP 200)"
    CSS_TYPE=$(echo "$CSS_RESPONSE" | grep -i "content-type" || echo "")
    echo "   $CSS_TYPE"
else
    echo "❌ CSS not accessible via local server (HTTP $CSS_STATUS)"
    echo "$CSS_RESPONSE" | head -5
    exit 1
fi
echo ""

# 4. Test local JS accessibility
echo "Step 4: Testing local JS accessibility..."
JS_URL="http://127.0.0.1:3000/_next/static/chunks/$JS_BASENAME"
JS_RESPONSE=$(curl -sI "$JS_URL" 2>&1)
JS_STATUS=$(echo "$JS_RESPONSE" | head -1 | grep -o "HTTP/[0-9.]* [0-9]*" | awk '{print $2}')

if [ "$JS_STATUS" = "200" ]; then
    echo "✅ JS accessible via local server (HTTP 200)"
    JS_TYPE=$(echo "$JS_RESPONSE" | grep -i "content-type" || echo "")
    echo "   $JS_TYPE"
else
    echo "❌ JS not accessible via local server (HTTP $JS_STATUS)"
    echo "$JS_RESPONSE" | head -5
    exit 1
fi
echo ""

# 5. Test public CSS accessibility
echo "Step 5: Testing public CSS accessibility..."
PUBLIC_CSS_URL="https://www.cryptorafts.com/_next/static/css/$CSS_BASENAME"
PUBLIC_CSS_RESPONSE=$(curl -sI "$PUBLIC_CSS_URL" 2>&1)
PUBLIC_CSS_STATUS=$(echo "$PUBLIC_CSS_RESPONSE" | head -1 | grep -o "HTTP/[0-9.]* [0-9]*" | awk '{print $2}')

if [ "$PUBLIC_CSS_STATUS" = "200" ]; then
    echo "✅ CSS accessible via public URL (HTTP 200)"
    PUBLIC_CSS_TYPE=$(echo "$PUBLIC_CSS_RESPONSE" | grep -i "content-type" || echo "")
    echo "   $PUBLIC_CSS_TYPE"
else
    echo "❌ CSS not accessible via public URL (HTTP $PUBLIC_CSS_STATUS)"
    echo "$PUBLIC_CSS_RESPONSE" | head -5
fi
echo ""

# 6. Test public JS accessibility
echo "Step 6: Testing public JS accessibility..."
PUBLIC_JS_URL="https://www.cryptorafts.com/_next/static/chunks/$JS_BASENAME"
PUBLIC_JS_RESPONSE=$(curl -sI "$PUBLIC_JS_URL" 2>&1)
PUBLIC_JS_STATUS=$(echo "$PUBLIC_JS_RESPONSE" | head -1 | grep -o "HTTP/[0-9.]* [0-9]*" | awk '{print $2}')

if [ "$PUBLIC_JS_STATUS" = "200" ]; then
    echo "✅ JS accessible via public URL (HTTP 200)"
    PUBLIC_JS_TYPE=$(echo "$PUBLIC_JS_RESPONSE" | grep -i "content-type" || echo "")
    echo "   $PUBLIC_JS_TYPE"
else
    echo "❌ JS not accessible via public URL (HTTP $PUBLIC_JS_STATUS)"
    echo "$PUBLIC_JS_RESPONSE" | head -5
fi
echo ""

# 7. Check if CSS is in HTML
echo "Step 7: Checking if CSS is referenced in HTML..."
LOCAL_HTML=$(curl -s http://127.0.0.1:3000/ 2>&1)
if echo "$LOCAL_HTML" | grep -q "$CSS_BASENAME"; then
    echo "✅ CSS file referenced in local HTML"
else
    echo "❌ CSS file NOT referenced in local HTML"
fi
echo ""

# 8. Check if JS is in HTML
echo "Step 8: Checking if JS is referenced in HTML..."
if echo "$LOCAL_HTML" | grep -q "$JS_BASENAME"; then
    echo "✅ JS file referenced in local HTML"
else
    echo "⚠️  JS file NOT referenced in local HTML (might be in different chunk)"
fi
echo ""

# 9. Check public HTML
echo "Step 9: Checking public HTML..."
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/ 2>&1)
if echo "$PUBLIC_HTML" | grep -q "$CSS_BASENAME"; then
    echo "✅ CSS file referenced in public HTML"
else
    echo "❌ CSS file NOT referenced in public HTML"
fi
echo ""

# 10. Verify CSS content
echo "Step 10: Verifying CSS content..."
CSS_CONTENT=$(curl -s "$CSS_URL" 2>&1)
if echo "$CSS_CONTENT" | grep -q "hero-content"; then
    echo "✅ CSS contains hero-content styles"
else
    echo "⚠️  CSS does not contain hero-content styles"
fi

if [ ${#CSS_CONTENT} -gt 1000 ]; then
    echo "✅ CSS content size: ${#CSS_CONTENT} characters"
else
    echo "⚠️  CSS content is very small: ${#CSS_CONTENT} characters"
fi
echo ""

echo "=========================================="
echo "CSS/JS STATUS CHECK COMPLETE"
echo "=========================================="
echo ""
echo "SUMMARY:"
echo "  CSS File: $CSS_BASENAME ($CSS_SIZE bytes)"
echo "  JS File: $JS_BASENAME ($JS_SIZE bytes)"
echo "  Local CSS: HTTP $CSS_STATUS"
echo "  Local JS: HTTP $JS_STATUS"
echo "  Public CSS: HTTP $PUBLIC_CSS_STATUS"
echo "  Public JS: HTTP $PUBLIC_JS_STATUS"
echo ""
if [ "$CSS_STATUS" = "200" ] && [ "$JS_STATUS" = "200" ] && [ "$PUBLIC_CSS_STATUS" = "200" ] && [ "$PUBLIC_JS_STATUS" = "200" ]; then
    echo "✅ ALL FILES ACCESSIBLE (HTTP 200)"
    echo ""
    echo "If UI still not showing, the issue is browser cache."
    echo "Clear browser cache (Ctrl+Shift+Delete) and test in incognito mode."
else
    echo "❌ SOME FILES NOT ACCESSIBLE"
    echo ""
    echo "Need to fix file accessibility issues."
fi
echo ""

