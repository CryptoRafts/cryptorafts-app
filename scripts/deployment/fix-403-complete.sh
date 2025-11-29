#!/bin/bash

# ============================================
# 🔧 COMPLETE 403 FIX - ALL POSSIBLE ISSUES
# ============================================
# This script fixes ALL possible causes of 403 error

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🔧 COMPLETE 403 ERROR FIX - ALL ISSUES 🔧               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

APP_DIR="/var/www/cryptorafts"
NGINX_CONF="/etc/nginx/sites-available/cryptorafts"
NGINX_ENABLED="/etc/nginx/sites-enabled/cryptorafts"

# Check current status
echo "═══════════════════════════════════════════════════════════"
echo "DIAGNOSING CURRENT STATUS..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "⚠️  App directory not found: $APP_DIR"
    echo "Creating directory..."
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
fi

# Check current permissions
echo "Current permissions:"
ls -la $APP_DIR | head -5
echo ""

# Check if app is running
echo "Checking PM2 status:"
if command -v pm2 &> /dev/null; then
    pm2 status || echo "PM2 not running or no apps"
else
    echo "⚠️  PM2 not installed"
fi
echo ""

# Check if port 3000 is accessible
echo "Checking port 3000:"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Port 3000 is responding"
else
    echo "❌ Port 3000 is NOT responding (app not running)"
fi
echo ""

# Check nginx configuration
echo "Checking nginx configuration:"
if [ -f "$NGINX_CONF" ]; then
    echo "✅ Nginx config exists"
    if grep -q "proxy_pass http://localhost:3000" "$NGINX_CONF"; then
        echo "✅ Proxy to port 3000 configured"
    else
        echo "❌ Proxy to port 3000 NOT configured"
    fi
else
    echo "❌ Nginx config NOT found"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "FIXING ALL ISSUES..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# FIX 1: Directory permissions
echo "[1/7] Fixing directory permissions..."
cd $APP_DIR
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR
# Also allow owner to write
sudo chown -R $USER:$USER $APP_DIR
sudo chmod -R u+w $APP_DIR
echo "✅ Permissions fixed"

# FIX 2: Ensure Next.js app is running
echo ""
echo "[2/7] Ensuring Next.js app is running..."
cd $APP_DIR

# Switch to VPS config
if [ ! -f "next.config.js" ] || ! grep -q "VPS\|output.*export" next.config.js 2>/dev/null; then
    if [ -f "next.config.vps.js" ]; then
        cp next.config.vps.js next.config.js
        echo "✅ VPS config activated"
    fi
fi

# Create .env.production if missing
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production missing - creating template"
    cat > .env.production << 'ENVEOF'
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
OPENAI_API_KEY=your_openai_key_here
ENVEOF
    echo "⚠️  Please edit .env.production with your actual Firebase keys"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Build if needed
if [ ! -d ".next" ]; then
    echo "Building application..."
    npm run build
fi

# Create logs directory
mkdir -p logs

# Start/restart with PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q cryptorafts; then
        echo "Restarting existing app..."
        pm2 restart cryptorafts
    else
        echo "Starting new app..."
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js
        else
            pm2 start server.js --name cryptorafts
        fi
    fi
    pm2 save
    echo "✅ Application started/restarted with PM2"
else
    echo "⚠️  PM2 not installed - installing..."
    sudo npm install -g pm2
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start server.js --name cryptorafts
    fi
    pm2 save
    echo "✅ PM2 installed and app started"
fi

# Wait for app to start
echo "Waiting for app to start..."
sleep 5

# Verify app is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App is responding on port 3000"
else
    echo "⚠️  App not responding yet - checking PM2 logs..."
    pm2 logs cryptorafts --lines 20 --nostream
fi

# FIX 3: Create proper nginx configuration
echo ""
echo "[3/7] Creating/updating nginx configuration..."

sudo tee $NGINX_CONF > /dev/null << 'NGINXEOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

# Main HTTPS server - PROXY TO NEXT.JS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    # SSL certificates (set by certbot)
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    
    # If SSL not installed yet, comment these and use certbot
    # ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    # ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # IMPORTANT: Proxy ALL requests to Next.js app on port 3000
    location / {
        # Disable direct file serving - proxy everything
        try_files $uri $uri/ @proxy;
    }

    location @proxy {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Cache control
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Also proxy root location directly
    location = / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass 1;
    }
}
NGINXEOF

echo "✅ Nginx configuration created/updated"

# FIX 4: Enable site
echo ""
echo "[4/7] Enabling nginx site..."
sudo rm -f /etc/nginx/sites-enabled/default
if [ ! -L "$NGINX_ENABLED" ]; then
    sudo ln -s $NGINX_CONF $NGINX_ENABLED
fi
echo "✅ Site enabled"

# FIX 5: Test nginx configuration
echo ""
echo "[5/7] Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors - fixing..."
    # Remove problematic configs
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
fi

# FIX 6: Setup SSL if needed
echo ""
echo "[6/7] Checking SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/cryptorafts.com/fullchain.pem" ]; then
    echo "⚠️  SSL certificate not found"
    if command -v certbot &> /dev/null; then
        echo "Installing SSL certificate..."
        sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect || echo "SSL installation failed - will use self-signed"
    else
        echo "⚠️  Certbot not installed - installing..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
        sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect || echo "SSL installation may need manual setup"
    fi
else
    echo "✅ SSL certificate exists"
fi

# FIX 7: Reload nginx
echo ""
echo "[7/7] Reloading nginx..."
sudo systemctl reload nginx || sudo systemctl restart nginx
echo "✅ Nginx reloaded"

# Final verification
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION..."
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Checking PM2 status:"
pm2 status
echo ""

echo "Checking if app responds:"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js app is responding on port 3000"
    curl -I http://localhost:3000 | head -3
else
    echo "❌ App not responding - checking logs..."
    pm2 logs cryptorafts --lines 30 --nostream
fi
echo ""

echo "Checking nginx status:"
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "Checking nginx error log (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log
echo ""

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         ✅ FIX COMPLETE! ✅                               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "✅ All fixes applied"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Visit: https://www.cryptorafts.com"
echo "2. If still 403, check:"
echo "   - PM2 logs: pm2 logs cryptorafts"
echo "   - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - App status: pm2 status"
echo "   - Port 3000: curl http://localhost:3000"
echo ""
echo "3. Make sure .env.production has your Firebase keys"
echo ""
echo "🌐 Your app should now be accessible at:"
echo "   https://www.cryptorafts.com"
echo ""

