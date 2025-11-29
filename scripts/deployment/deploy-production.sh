#!/bin/bash

echo "========================================"
echo "  CRYPTORAFTS PRODUCTION DEPLOYMENT"
echo "========================================"
echo ""

echo "[1/4] Checking if Vercel CLI is installed..."
if ! command -v vercel &> /dev/null
then
    echo "Vercel CLI not found! Installing..."
    npm i -g vercel
else
    echo "Vercel CLI is already installed!"
fi
echo ""

echo "[2/4] Running production build test..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed! Please fix errors before deploying."
    exit 1
fi
echo "Build successful!"
echo ""

echo "[3/4] Deploying to Vercel Production..."
echo "This will deploy your app to production."
echo ""
read -p "Are you sure you want to deploy to production? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Deploying..."
vercel --prod

echo ""
echo "[4/4] Deployment complete!"
echo ""
echo "========================================"
echo "  DEPLOYMENT SUCCESSFUL!"
echo "========================================"
echo ""
echo "Your app is now live on Vercel!"
echo "Check the URL above to access it."
echo ""

