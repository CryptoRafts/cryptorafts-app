#!/bin/bash
# Final UI Check - Verify HTML structure and content

set -e

cd /var/www/cryptorafts || exit 1

echo "=========================================="
echo "FINAL UI CHECK - HTML STRUCTURE"
echo "=========================================="
echo ""

# Get HTML from public URL
PUBLIC_HTML=$(curl -s https://www.cryptorafts.com/)

# 1. Check HTML structure
echo "1. HTML Structure Check:"
HTML_LENGTH=$(echo "$PUBLIC_HTML" | wc -c)
echo "   HTML size: $HTML_LENGTH bytes"
echo ""

# 2. Check for hero section content
echo "2. Hero Section Content:"
if echo "$PUBLIC_HTML" | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "   ✅ 'WELCOME TO CRYPTORAFTS' found"
    echo "$PUBLIC_HTML" | grep -o "WELCOME TO CRYPTORAFTS" | head -1
else
    echo "   ❌ 'WELCOME TO CRYPTORAFTS' NOT found"
fi

if echo "$PUBLIC_HTML" | grep -q "The AI-Powered Web3 Ecosystem"; then
    echo "   ✅ 'The AI-Powered Web3 Ecosystem' found"
else
    echo "   ❌ 'The AI-Powered Web3 Ecosystem' NOT found"
fi

if echo "$PUBLIC_HTML" | grep -q "GET STARTED"; then
    echo "   ✅ 'GET STARTED' button found"
else
    echo "   ❌ 'GET STARTED' button NOT found"
fi
echo ""

# 3. Check CSS links
echo "3. CSS Links in HTML:"
CSS_LINKS=$(echo "$PUBLIC_HTML" | grep -o '<link[^>]*rel="stylesheet"[^>]*>' | head -5)
if [ -n "$CSS_LINKS" ]; then
    echo "   ✅ CSS links found:"
    echo "$CSS_LINKS" | sed 's/^/      /'
    
    # Extract CSS file name
    CSS_FILE=$(echo "$CSS_LINKS" | grep -o '/_next/static/css/[^"]*' | head -1 | sed 's|/_next/static/css/||')
    if [ -n "$CSS_FILE" ]; then
        echo ""
        echo "   CSS file: $CSS_FILE"
        echo "   Full URL: https://www.cryptorafts.com/_next/static/css/$CSS_FILE"
        
        # Check if CSS file exists
        if [ -f ".next/static/css/$CSS_FILE" ]; then
            echo "   ✅ CSS file exists on server"
            CSS_SIZE=$(wc -c < ".next/static/css/$CSS_FILE")
            echo "   CSS size: $CSS_SIZE bytes"
        else
            echo "   ❌ CSS file NOT found on server"
        fi
        
        # Check if CSS is accessible via URL
        CSS_RESPONSE=$(curl -sI "https://www.cryptorafts.com/_next/static/css/$CSS_FILE" 2>&1)
        if echo "$CSS_RESPONSE" | grep -q "200"; then
            echo "   ✅ CSS accessible via URL (HTTP 200)"
        else
            echo "   ❌ CSS NOT accessible via URL"
            echo "$CSS_RESPONSE" | head -3
        fi
    fi
else
    echo "   ❌ No CSS links found in HTML"
fi
echo ""

# 4. Check script tags
echo "4. Script Tags:"
SCRIPT_COUNT=$(echo "$PUBLIC_HTML" | grep -o '<script[^>]*src="[^"]*"' | wc -l)
echo "   Script tags with src: $SCRIPT_COUNT"
if [ "$SCRIPT_COUNT" -gt 0 ]; then
    echo "   ✅ Script tags found"
    echo "$PUBLIC_HTML" | grep -o '<script[^>]*src="[^"]*"' | head -3 | sed 's/^/      /'
else
    echo "   ❌ No script tags found"
fi
echo ""

# 5. Check for Next.js data
echo "5. Next.js Data:"
if echo "$PUBLIC_HTML" | grep -q "__NEXT_DATA__"; then
    echo "   ✅ __NEXT_DATA__ found"
else
    echo "   ❌ __NEXT_DATA__ NOT found"
fi
echo ""

# 6. Check for body content
echo "6. Body Content:"
BODY_CONTENT=$(echo "$PUBLIC_HTML" | grep -o '<body[^>]*>.*</body>' | head -c 500)
if [ -n "$BODY_CONTENT" ]; then
    BODY_LENGTH=$(echo "$BODY_CONTENT" | wc -c)
    echo "   Body content length: $BODY_LENGTH bytes"
    if [ "$BODY_LENGTH" -lt 1000 ]; then
        echo "   ⚠️  Body content seems very short"
    else
        echo "   ✅ Body content looks good"
    fi
else
    echo "   ❌ No body content found"
fi
echo ""

# 7. Check for main content sections
echo "7. Main Content Sections:"
if echo "$PUBLIC_HTML" | grep -q "<main\|<section\|<div.*class.*hero"; then
    echo "   ✅ Main content sections found"
else
    echo "   ❌ No main content sections found"
fi
echo ""

echo "=========================================="
echo "CHECK COMPLETE"
echo "=========================================="

