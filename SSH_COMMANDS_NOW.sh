#!/bin/bash
# Run these commands in your SSH terminal RIGHT NOW
# Copy and paste ONE BY ONE

# Step 1: Check what's in your home directory
echo "Checking current directory..."
pwd
ls -la

# Step 2: Check if Node.js is installed
echo ""
echo "Checking Node.js..."
which node || echo "❌ Node.js NOT installed"
which npm || echo "❌ npm NOT installed"

# Step 3: Install Node.js (if not installed)
echo ""
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18.x..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs || sudo apt-get install -y nodejs
    echo "✅ Node.js installed"
else
    echo "✅ Node.js already installed"
    node --version
    npm --version
fi

# Step 4: Create cryptorafts directory
echo ""
echo "Creating cryptorafts directory..."
mkdir -p ~/cryptorafts
cd ~/cryptorafts
pwd

# Step 5: Check if files exist
echo ""
echo "Checking if files are uploaded..."
ls -la src/app/page.tsx 2>/dev/null || echo "❌ Files NOT uploaded yet!"

# If files NOT found:
if [ ! -f "src/app/page.tsx" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  FILES NOT UPLOADED YET!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "You need to upload files FIRST via FileZilla!"
    echo ""
    echo "FileZilla Settings:"
    echo "  Host: sftp://145.79.211.130"
    echo "  Port: 65002"
    echo "  Username: u386122906"
    echo "  Password: Shamsi2627@@"
    echo ""
    echo "Upload FROM: C:\Users\dell\cryptorafts-starter"
    echo "Upload TO: /home/u386122906/cryptorafts/"
    echo ""
    echo "IMPORTANT: Upload the ENTIRE src/ folder!"
    echo ""
    echo "After uploading, run these commands again:"
    echo "  cd ~/cryptorafts"
    echo "  ls -la src/app/page.tsx"
    echo "  npm install --production"
    echo ""
    exit 1
fi

# If files found, continue:
echo "✅ Files found!"
echo ""
echo "Now run:"
echo "  npm install --production"
echo "  rm -rf .next out"
echo "  NODE_ENV=production npm run build"
echo ""

