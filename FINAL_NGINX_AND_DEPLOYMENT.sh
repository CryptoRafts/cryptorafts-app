#!/bin/bash

# ==========================================
# FINAL NGINX CONFIGURATION AND DEPLOYMENT
# ==========================================
# This script:
# 1. Creates Nginx configuration file
# 2. Links and applies Nginx configuration
# 3. Handles SSL errors gracefully
# 4. Deploys final code
# NO APP CODE CHANGES
# ==========================================

set -e

APP_NAME="cryptorafts"
APP_DIR="/var/www/cryptorafts"
NGINX_CONFIG="/etc/nginx/sites-available/cryptorafts.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/cryptorafts.com"

echo "=========================================="
echo "FINAL NGINX CONFIGURATION AND DEPLOYMENT"
echo "=========================================="
echo ""

# ==========================================
# STEP 1: CREATE NGINX CONFIG FILE
# ==========================================

echo "Step 1: Creating Nginx configuration file..."
echo "----------------------------------------"

# First, try to create with SSL (if certificates exist)
cat > /tmp/nginx_config_ssl.conf << 'EOF'
server {
    # Listen on port 80 (HTTP)
    listen 80;
    server_name www.cryptorafts.com cryptorafts.com;

    # Redirect HTTP to HTTPS
    return 301 https://www.cryptorafts.com$request_uri;
}

server {
    # Listen on port 443 (HTTPS)
    listen 443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    # SSL CERTIFICATE PATHS
    ssl_certificate /etc/ssl/certs/cryptorafts.com.pem; 
    ssl_certificate_key /etc/ssl/private/cryptorafts.com.key;

    # Increase body size limit
    client_max_body_size 50M;

    location / {
        # CRITICAL: Proxy all traffic to your Node.js app on port 3000
        proxy_pass http://localhost:3000;
        
        # ESSENTIAL HEADERS for Next.js asset paths
        proxy_set_header Host $host; 
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Next.js API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Create HTTP-only config as fallback
cat > /tmp/nginx_config_http.conf << 'EOF'
server {
    listen 80;
    server_name www.cryptorafts.com cryptorafts.com;

    # Increase body size limit
    client_max_body_size 50M;

    location / {
        # CRITICAL: Proxy all traffic to your Node.js app on port 3000
        proxy_pass http://localhost:3000;
        
        # ESSENTIAL HEADERS for Next.js asset paths
        proxy_set_header Host $host; 
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Next.js API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Try SSL config first
sudo cp /tmp/nginx_config_ssl.conf "$NGINX_CONFIG"
echo "✅ Nginx config file created (SSL version)"
echo ""

# ==========================================
# STEP 2: LINK AND APPLY NGINX CONFIGURATION
# ==========================================

echo "Step 2: Linking and applying Nginx configuration..."
echo "----------------------------------------"

# Remove default config
sudo rm -f /etc/nginx/sites-enabled/default
echo "✅ Removed default Nginx config"

# Remove old cryptorafts config if exists
sudo rm -f "$NGINX_ENABLED"
echo "✅ Removed old cryptorafts config"

# Link new config
sudo ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
echo "✅ Linked Nginx config"
echo ""

# Test Nginx configuration
echo "Testing Nginx configuration..."
if sudo nginx -t 2>/dev/null; then
    echo "✅ Nginx configuration is valid (SSL)"
    sudo systemctl restart nginx
    echo "✅ Nginx restarted"
else
    echo "⚠️  SSL configuration failed. Trying HTTP-only configuration..."
    echo ""
    
    # Use HTTP-only config
    sudo cp /tmp/nginx_config_http.conf "$NGINX_CONFIG"
    echo "✅ Created HTTP-only Nginx config"
    
    # Test again
    if sudo nginx -t 2>/dev/null; then
        echo "✅ Nginx configuration is valid (HTTP-only)"
        sudo systemctl restart nginx
        echo "✅ Nginx restarted with HTTP-only config"
    else
        echo "❌ Nginx configuration still has errors:"
        sudo nginx -t
        exit 1
    fi
fi
echo ""

# ==========================================
# STEP 3: FINAL CODE DEPLOYMENT
# ==========================================

echo "Step 3: Final code deployment..."
echo "----------------------------------------"

cd "$APP_DIR" || exit 1
echo "✅ Working directory: $(pwd)"
echo ""

# Stop PM2
echo "A. Stopping PM2..."
pm2 stop "$APP_NAME" 2>/dev/null || echo "⚠️  PM2 process not running"
echo "✅ PM2 stopped"
echo ""

# Clean build cache
echo "B. Cleaning build cache..."
rm -rf .next/cache
rm -rf .next/static
rm -f .next/lock
echo "✅ Build cache cleaned"
echo ""

# Install dependencies
echo "C. Installing dependencies..."
npm install --legacy-peer-deps --production=false
echo "✅ Dependencies installed"
echo ""

# Build application
echo "D. Building application..."
echo "This may take a few minutes..."
npm run build
echo "✅ Build completed"
echo ""

# Restart PM2
echo "E. Restarting PM2..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save
echo "✅ PM2 restarted"
echo ""

# Wait for app to start
echo "F. Waiting for application to start..."
sleep 10
echo "✅ Wait complete"
echo ""

# ==========================================
# STEP 4: VERIFICATION
# ==========================================

echo "Step 4: Verification..."
echo "----------------------------------------"

# Check PM2 Status
echo "A. Checking PM2 Status..."
pm2 status "$APP_NAME"
echo ""

# Check if port is listening
echo "B. Checking if port 3000 is listening..."
if netstat -tuln | grep -q ":3000"; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is NOT listening"
fi
echo ""

# Test localhost response
echo "C. Testing localhost response..."
LOCALHOST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$LOCALHOST_RESPONSE" = "200" ]; then
    echo "✅ Localhost responding with 200 OK"
elif [ "$LOCALHOST_RESPONSE" = "000" ]; then
    echo "❌ Localhost not responding (connection refused)"
    echo "Checking PM2 logs..."
    pm2 logs "$APP_NAME" --lines 20 --nostream
else
    echo "⚠️  Localhost responding with HTTP $LOCALHOST_RESPONSE"
fi
echo ""

# Check for __NEXT_DATA__
echo "D. Checking for __NEXT_DATA__ in HTML..."
if curl -s http://localhost:3000/ 2>/dev/null | grep -q "__NEXT_DATA__"; then
    echo "✅ __NEXT_DATA__ is present in HTML"
else
    echo "⚠️  __NEXT_DATA__ is missing from HTML"
fi
echo ""

# Check for content
echo "E. Checking for content in HTML..."
if curl -s http://localhost:3000/ 2>/dev/null | grep -q "WELCOME TO CRYPTORAFTS"; then
    echo "✅ Content is present in HTML"
else
    echo "⚠️  Content may be missing from HTML"
fi
echo ""

# Check Nginx status
echo "F. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl start nginx
    echo "✅ Nginx started"
fi
echo ""

# Show PM2 logs
echo "G. Showing last 10 lines of PM2 logs..."
pm2 logs "$APP_NAME" --lines 10 --nostream
echo ""

# ==========================================
# FINAL SUMMARY
# ==========================================

echo "=========================================="
echo "FINAL NGINX AND DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test website: https://www.cryptorafts.com (or http:// if SSL not configured)"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Test in Incognito window"
echo "4. Check PM2 logs: pm2 logs $APP_NAME --lines 50"
echo ""
echo "If using HTTP-only config, test with: http://www.cryptorafts.com"
echo ""

