#!/bin/bash
set -e

echo "========================================="
echo "FIXING FILE MANAGER PERMISSIONS"
echo "========================================="
echo ""

cd /var/www/cryptorafts

# Step 1: Fix directory permissions
echo "Step 1: Fixing directory permissions..."
echo ""
find . -type d -exec chmod 755 {} \;
echo "✅ Directory permissions fixed"
echo ""

# Step 2: Fix file permissions
echo "Step 2: Fixing file permissions..."
echo ""
find . -type f -exec chmod 644 {} \;
echo "✅ File permissions fixed"
echo ""

# Step 3: Make scripts executable
echo "Step 3: Making scripts executable..."
echo ""
find . -name "*.sh" -exec chmod +x {} \;
find . -name "server.js" -exec chmod +x {} \;
echo "✅ Scripts made executable"
echo ""

# Step 4: Fix ownership (optional - keep as root for now)
echo "Step 4: Verifying ownership..."
echo ""
ls -ld /var/www/cryptorafts
echo ""

# Step 5: List files to verify
echo "Step 5: Listing files to verify..."
echo ""
ls -la | head -20
echo ""

# Step 6: Check src directory
echo "Step 6: Checking src directory..."
echo ""
ls -la src/ | head -10
echo ""

echo "========================================="
echo "PERMISSIONS FIXED"
echo "========================================="
echo ""
echo "Files should now be visible in the file manager!"
echo "Directory: /var/www/cryptorafts"
echo ""

