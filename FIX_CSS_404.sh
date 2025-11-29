#!/bin/bash
# Fix CSS/JS 404 errors - Clean build and rebuild

cd /var/www/cryptorafts

echo "🔍 Checking current build files..."
ls -la .next/static/css/ 2>/dev/null | head -5
ls -la .next/static/chunks/ 2>/dev/null | head -5

echo ""
echo "🧹 Cleaning build cache..."
rm -rf .next/cache
rm -rf .next/standalone
rm -rf .next/server
rm -rf .next/static

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
echo "✅ Verifying server..."
sleep 3
curl -s http://localhost:3000 | grep -o 'WELCOME TO CRYPTORAFTS' | head -1 && echo "✅ Content verified" || echo "❌ Content not found"

echo ""
echo "✅ Fix complete!"

