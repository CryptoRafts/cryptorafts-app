#!/bin/bash
set -e

VPS_IP="145.79.211.130"
SSH_PORT=65002
SSH_USER="u386122906"
SSH_PASSWORD="Shamsi2627@@"

echo "FULLY AUTOMATED DEPLOYMENT"
echo "=========================="
echo ""

# Install sshpass
echo "Installing sshpass..."
sudo apt-get update -qq > /dev/null
sudo apt-get install -y sshpass > /dev/null 2>&1 || echo "sshpass installation failed, continuing..."

# Create directory on VPS
echo "Creating directory on VPS..."
sshpass -p "$SSH_PASSWORD" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SSH_USER}@${VPS_IP} "sudo mkdir -p /var/www/cryptorafts && sudo chown -R ${SSH_USER}:${SSH_USER} /var/www/cryptorafts" || true

# Upload files
echo ""
echo "Uploading files to VPS..."
echo "This may take 10-15 minutes..."
echo ""

cd DEPLOY_TO_VPS

# Upload src folder
echo "Uploading src/ folder..."
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r src ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/

# Upload individual files
echo "Uploading package.json..."
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null package.json ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/

echo "Uploading next.config.js..."
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null next.config.js ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/

echo "Uploading tsconfig.json..."
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null tsconfig.json ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/

# Upload public folder if exists
if [ -d "public" ]; then
    echo "Uploading public/ folder..."
    sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r public ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/ || true
fi

cd ..

# Upload deployment script
echo "Uploading deployment script..."
sshpass -p "$SSH_PASSWORD" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null DEPLOY_VPS.sh ${SSH_USER}@${VPS_IP}:/var/www/cryptorafts/DEPLOY_AUTO.sh

echo ""
echo "Files uploaded!"
echo ""

# Run deployment script
echo "Running deployment script..."
echo "This will take 10-15 minutes. Please wait..."
echo ""

sshpass -p "$SSH_PASSWORD" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SSH_USER}@${VPS_IP} "cd /var/www/cryptorafts && bash DEPLOY_AUTO.sh"

echo ""
echo "DEPLOYMENT COMPLETE!"
echo "Visit: https://www.cryptorafts.com"