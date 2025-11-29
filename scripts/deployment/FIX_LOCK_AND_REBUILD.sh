#!/bin/bash

cd /var/www/cryptorafts || exit 1

echo "🔧 Fixing build lock and rebuilding..."

# 1. Remove lock file
if [ -f ".next/lock" ]; then
    echo "Removing .next/lock..."
    rm -f .next/lock
fi

# 2. Check for running build processes
echo "Checking for running build processes..."
pkill -f "next build" || true
sleep 2

# 3. Remove lock again (in case it was recreated)
rm -f .next/lock

# 4. Rebuild
echo "Building..."
npm run build

# 5. Restart PM2
echo "Restarting PM2..."
pm2 restart cryptorafts

# 6. Reload Nginx
echo "Reloading Nginx..."
systemctl reload nginx

echo "✅ Complete!"

