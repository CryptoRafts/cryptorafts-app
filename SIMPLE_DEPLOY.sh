#!/bin/bash
# Simple deployment script - Run this on VPS after uploading fixed page.tsx

cd /var/www/cryptorafts

echo "🔨 Rebuilding application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🔄 Restarting PM2..."
    pm2 restart cryptorafts --update-env
    echo ""
    echo "📊 PM2 Status:"
    pm2 status
    echo ""
    echo "✅ Deployment complete!"
else
    echo "❌ Build failed!"
    exit 1
fi

