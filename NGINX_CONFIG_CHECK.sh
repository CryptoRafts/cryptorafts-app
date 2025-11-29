#!/bin/bash
# Nginx Configuration Check and Fix Script
# This script verifies and fixes Nginx configuration for Next.js

set -e

echo "=========================================="
echo "NGINX CONFIGURATION CHECK"
echo "=========================================="
echo ""

# 1. Check Nginx Configuration Files
echo "1. Checking Nginx Configuration Files:"
NGINX_CONFIG="/etc/nginx/sites-available/cryptorafts"
NGINX_ENABLED="/etc/nginx/sites-enabled/cryptorafts"

if [ -f "$NGINX_CONFIG" ]; then
    echo "   ✅ Found: $NGINX_CONFIG"
    CONFIG_FILE="$NGINX_CONFIG"
elif [ -f "$NGINX_ENABLED" ]; then
    echo "   ✅ Found: $NGINX_ENABLED"
    CONFIG_FILE="$NGINX_ENABLED"
else
    # Try to find any config file
    CONFIG_FILE=$(find /etc/nginx/sites-enabled -name "*cryptorafts*" -o -name "*default*" 2>/dev/null | head -1)
    if [ -n "$CONFIG_FILE" ]; then
        echo "   ✅ Found: $CONFIG_FILE"
    else
        echo "   ⚠️  No specific config found, checking default"
        CONFIG_FILE="/etc/nginx/sites-enabled/default"
    fi
fi
echo ""

# 2. Check Current Configuration
echo "2. Current Configuration:"
if [ -f "$CONFIG_FILE" ]; then
    echo "   Configuration file: $CONFIG_FILE"
    echo ""
    
    # Check for proxy_pass
    if grep -q "proxy_pass.*3000" "$CONFIG_FILE"; then
        echo "   ✅ proxy_pass to port 3000 found"
        grep "proxy_pass.*3000" "$CONFIG_FILE" | sed 's/^/      /'
    else
        echo "   ❌ proxy_pass to port 3000 NOT found"
    fi
    echo ""
    
    # Check for proxy headers
    if grep -q "proxy_set_header Host" "$CONFIG_FILE"; then
        echo "   ✅ proxy_set_header Host found"
    else
        echo "   ⚠️  proxy_set_header Host NOT found"
    fi
    
    if grep -q "proxy_http_version" "$CONFIG_FILE"; then
        echo "   ✅ proxy_http_version found"
    else
        echo "   ⚠️  proxy_http_version NOT found"
    fi
    echo ""
    
    # Check for _next/static block
    if grep -q "_next/static" "$CONFIG_FILE"; then
        echo "   ✅ _next/static block found"
    else
        echo "   ⚠️  _next/static block NOT found"
    fi
    echo ""
    
    # Show current location / block
    echo "   Current location / block:"
    sed -n '/location \//,/^[[:space:]]*}/p' "$CONFIG_FILE" | head -20 | sed 's/^/      /'
    echo ""
else
    echo "   ❌ Configuration file not found"
fi
echo ""

# 3. Test Nginx Configuration
echo "3. Testing Nginx Configuration:"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1 | sed 's/^/      /'
fi
echo ""

# 4. Generate Correct Configuration
echo "4. Recommended Nginx Configuration:"
echo "   Add this to your Nginx config file ($CONFIG_FILE):"
echo ""
cat << 'EOF'
    location / {
        # CRITICAL: Pass all requests to Next.js server on port 3000
        proxy_pass http://localhost:3000;
        
        # Essential Headers for Next.js to function correctly
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # CRITICAL: Serve static files directly from Next.js
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Serve public files directly
    location /public {
        proxy_pass http://localhost:3000;
    }
EOF
echo ""

# 5. Restart Nginx
echo "5. Restart Nginx:"
read -p "   Do you want to restart Nginx now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo systemctl restart nginx
    echo "   ✅ Nginx restarted"
else
    echo "   ⚠️  Nginx not restarted. Run manually: sudo systemctl restart nginx"
fi
echo ""

echo "=========================================="
echo "NGINX CHECK COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Review the recommended configuration above"
echo "2. Update your Nginx config file if needed"
echo "3. Test configuration: sudo nginx -t"
echo "4. Restart Nginx: sudo systemctl restart nginx"
echo ""







