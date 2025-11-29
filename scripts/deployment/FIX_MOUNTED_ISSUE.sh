#!/bin/bash

# Fix mounted state issue - Remove blocking mounted check
# Run this script directly on the VPS after SSHing in

echo "🔧 Fixing mounted state issue..."

cd /var/www/cryptorafts

# Backup current page.tsx
echo "📦 Backing up current page.tsx..."
cp src/app/page.tsx src/app/page.tsx.backup.$(date +%Y%m%d_%H%M%S)

# The mounted state check has been removed from page.tsx
# Now rebuild and restart

echo "🔨 Rebuilding application..."
npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🔄 Restarting PM2..."
    pm2 restart cryptorafts --update-env
    
    echo "📊 Checking PM2 status..."
    pm2 status
    
    echo "📝 Recent logs:"
    pm2 logs cryptorafts --lines 10 --nostream
    
    echo ""
    echo "✅ Fix complete! The mounted state check has been removed."
    echo "🌐 Your app should now show all content immediately."
    echo ""
    echo "⚠️  IMPORTANT: Clear your browser cache or use Incognito mode!"
    echo "   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
    echo "   - Or open a new Incognito/Private window"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

