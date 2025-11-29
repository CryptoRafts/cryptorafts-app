#!/bin/bash
# Fix Next.js Build Errors and CSS File Mismatch

cd /var/www/cryptorafts

echo "🔍 Checking current build status..."
pm2 status cryptorafts

echo ""
echo "🧹 Cleaning build cache and artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache

echo ""
echo "🔨 Rebuilding application..."
npm run build

echo ""
echo "✅ Checking new build files..."
ls -la .next/static/css/ 2>/dev/null | head -5
ls -la .next/static/chunks/ 2>/dev/null | head -5

echo ""
echo "🔄 Restarting PM2..."
pm2 restart cryptorafts --update-env

echo ""
echo "⏳ Waiting 5 seconds for app to start..."
sleep 5

echo ""
echo "🔍 Verifying server response..."
curl -s -o /dev/null -w "Homepage: %{http_code}\n" http://localhost:3000/

echo ""
echo "🔍 Checking CSS file..."
CSS_FILE=$(ls .next/static/css/*.css 2>/dev/null | head -1 | xargs basename)
if [ -n "$CSS_FILE" ]; then
  echo "CSS File: $CSS_FILE"
  curl -s -o /dev/null -w "CSS Status: %{http_code}\n" "http://localhost:3000/_next/static/css/$CSS_FILE"
else
  echo "❌ No CSS file found!"
fi

echo ""
echo "✅ Fix complete!"
