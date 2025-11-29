#!/bin/bash
set -e

echo "========================================="
echo "DIAGNOSING BUILD ISSUE"
echo "========================================="
echo ""

cd /var/www/cryptorafts

# Step 1: Check if there's a static index.html being served
echo "Step 1: Checking for static index.html files..."
echo ""
find . -name "index.html" -type f -not -path "./node_modules/*" -not -path "./.next/cache/*" -exec ls -la {} \; | head -10
echo ""

# Step 2: Check what's actually visible in the HTML (not hidden)
echo "Step 2: Checking visible content in HTML..."
echo ""
curl -s http://localhost:3000 | grep -v 'hidden' | grep -i 'cryptorafts\|welcome\|get started' | head -5
echo ""

# Step 3: Check if JavaScript files are loading
echo "Step 3: Checking JavaScript files..."
echo ""
JS_FILES=$(curl -s http://localhost:3000 | grep -o 'src="[^"]*\.js[^"]*"' | head -5)
echo "JavaScript files found:"
echo "$JS_FILES"
echo ""

# Step 4: Test if JavaScript files are accessible
echo "Step 4: Testing JavaScript file accessibility..."
echo ""
for js_file in $(curl -s http://localhost:3000 | grep -o 'src="[^"]*\.js[^"]*"' | sed 's/src="//;s/"//' | head -3); do
    echo "Testing: $js_file"
    curl -s -I "http://localhost:3000$js_file" | head -1
done
echo ""

# Step 5: Check if content is in hidden divs
echo "Step 5: Checking hidden content..."
echo ""
HIDDEN_CONTENT=$(curl -s http://localhost:3000 | grep -o '<div hidden[^>]*>.*</div>' | head -1 | wc -c)
echo "Hidden content size: $HIDDEN_CONTENT bytes"
echo ""

# Step 6: Check PM2 status
echo "Step 6: Checking PM2 status..."
echo ""
pm2 status
echo ""

# Step 7: Check server logs for errors
echo "Step 7: Checking server logs..."
echo ""
pm2 logs cryptorafts --lines 20 --nostream | tail -10
echo ""

echo "========================================="
echo "DIAGNOSIS COMPLETE"
echo "========================================="

