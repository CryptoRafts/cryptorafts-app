#!/bin/bash
# ============================================
# 🔧 FIX MIME TYPE ERROR - STATIC FILES
# ============================================
# Fix JavaScript files being served as HTML

set -e

APP_DIR="/var/www/cryptorafts"
USER="u386122906"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🔧 FIXING MIME TYPE ERROR 🔧                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Navigate to app directory
echo "[1/6] Checking app directory..."
cd $APP_DIR || { echo "❌ Directory not found: $APP_DIR"; exit 1; }
echo "✅ In directory: $APP_DIR"

# Step 2: Check if app is built
echo ""
echo "[2/6] Checking if app is built..."
if [ ! -d ".next" ]; then
    echo "⚠️  App not built. Building now..."
    npm install --production
    npm run build
    echo "✅ Build complete"
else
    echo "✅ App is built"
fi

# Step 3: Check if app is running
echo ""
echo "[3/6] Checking if app is running..."
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  App not responding on port 3000"
    echo "Starting app..."
    
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Stop existing app
    if pm2 list | grep -q cryptorafts; then
        pm2 stop cryptorafts
        pm2 delete cryptorafts
    fi
    
    # Start app
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    elif [ -f "server.js" ]; then
        pm2 start server.js --name cryptorafts
    else
        echo "❌ No server file found!"
        exit 1
    fi
    
    pm2 save
    echo "✅ App started"
    
    # Wait for app to start
    sleep 5
else
    echo "✅ App is running"
fi

# Step 4: Fix permissions
echo ""
echo "[4/6] Fixing permissions..."
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
echo "✅ Permissions fixed"

# Step 5: Fix Nginx configuration with correct MIME types
echo ""
echo "[5/6] Fixing Nginx configuration..."
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # MIME types - CRITICAL for static files
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Proxy to Next.js app for all requests
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets - let Next.js handle these
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Favicon and other static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
if [ ! -L "/etc/nginx/sites-enabled/cryptorafts" ]; then
    sudo ln -s /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/
fi

# Test Nginx config
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
else
    echo "❌ Nginx config test failed"
    sudo nginx -t
    exit 1
fi

# Step 6: Verify fix
echo ""
echo "[6/6] Verifying fix..."
sleep 3

echo ""
echo "Checking app status:"
pm2 status

echo ""
echo "Testing app response:"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App responding on port 3000"
    curl -I http://localhost:3000 2>/dev/null | head -5
else
    echo "❌ App not responding"
    echo "Check logs: pm2 logs cryptorafts"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ FIX COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 If still seeing MIME type errors:"
echo "   1. Clear browser cache (Ctrl+Shift+Delete)"
echo "   2. Hard refresh (Ctrl+F5)"
echo "   3. Check: pm2 logs cryptorafts"
echo "   4. Verify app is running: pm2 status"
echo "   5. Test static files: curl -I http://localhost:3000/_next/static/chunks/main-app-*.js"
echo ""

