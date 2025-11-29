#!/bin/bash
# Upload All Fixed Files to VPS
# This script uploads all fixed files to your VPS

set -e

# Configuration - SET YOUR VPS DETAILS HERE
VPS_IP="YOUR_VPS_IP"
VPS_USER="root"
VPS_DIR="/var/www/cryptorafts"
LOCAL_DIR="."

echo "=========================================="
echo "UPLOAD ALL FIXED FILES TO VPS"
echo "=========================================="
echo ""

# Check if VPS_IP is set
if [ "$VPS_IP" = "YOUR_VPS_IP" ]; then
    echo "❌ ERROR: Please set your VPS IP address in this script"
    echo "   Edit this file and replace YOUR_VPS_IP with your actual VPS IP"
    exit 1
fi

echo "VPS IP: $VPS_IP"
echo "VPS User: $VPS_USER"
echo "VPS Directory: $VPS_DIR"
echo "Local Directory: $LOCAL_DIR"
echo ""

read -p "Continue with upload? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Upload cancelled."
    exit 1
fi

echo ""
echo "Uploading files..."
echo ""

# Upload fixed source files
echo "1. Uploading src/app/page.tsx..."
scp "$LOCAL_DIR/src/app/page.tsx" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/app/page.tsx"
echo "   ✅ page.tsx uploaded"

echo "2. Uploading src/app/HomePageClient.tsx..."
scp "$LOCAL_DIR/src/app/HomePageClient.tsx" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/app/HomePageClient.tsx"
echo "   ✅ HomePageClient.tsx uploaded"

echo "3. Uploading src/components/PerfectHeader.tsx..."
scp "$LOCAL_DIR/src/components/PerfectHeader.tsx" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/components/PerfectHeader.tsx"
echo "   ✅ PerfectHeader.tsx uploaded"

# Upload deployment scripts
echo "4. Uploading deployment scripts..."
scp "$LOCAL_DIR/FINAL_DEPLOYMENT_COMPLETE.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"
scp "$LOCAL_DIR/NGINX_CONFIG_CHECK.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"
scp "$LOCAL_DIR/COMPREHENSIVE_VPS_DIAGNOSTIC.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"
echo "   ✅ Deployment scripts uploaded"

echo ""
echo "=========================================="
echo "FILES UPLOADED SUCCESSFULLY"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. SSH into VPS: ssh ${VPS_USER}@${VPS_IP}"
echo "2. Run deployment: cd ${VPS_DIR} && chmod +x *.sh && ./FINAL_DEPLOYMENT_COMPLETE.sh"
echo ""







