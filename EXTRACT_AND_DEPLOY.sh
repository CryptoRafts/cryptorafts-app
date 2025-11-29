#!/bin/bash
# ============================================
# EXTRACT TAR.GZ AND DEPLOY
# Try extracting tar.gz first, then deploy
# ============================================

set -e

echo "========================================"
echo "📦 EXTRACT AND DEPLOY"
echo "========================================"
echo ""

cd /var/www/cryptorafts

# Step 1: Try extracting tar.gz
echo "📦 Step 1: Trying to extract cryptorafts.tar.gz..."
if [ -f "cryptorafts.tar.gz" ]; then
    echo "Found cryptorafts.tar.gz, attempting extraction..."
    tar -xzf cryptorafts.tar.gz 2>&1 | head -20 || {
        echo "⚠️  Extraction failed or partial - trying to continue..."
    }
    echo "✅ Extraction attempted"
    echo ""
    
    # Fix ownership
    chown -R root:root /var/www/cryptorafts
    chmod -R 755 /var/www/cryptorafts
    find /var/www/cryptorafts -type f -exec chmod 644 {} \; 2>/dev/null || true
    echo "✅ Ownership and permissions fixed"
    echo ""
else
    echo "⚠️  cryptorafts.tar.gz not found"
    echo ""
fi

# Step 2: Check for files
echo "🔍 Step 2: Checking for files..."
ls -la /var/www/cryptorafts | head -20
echo ""

if [ -f "package.json" ] && [ -d "src" ]; then
    echo "✅ Files found! Proceeding with deployment..."
    echo ""
    
    # Step 3: Load NVM
    echo "📦 Step 3: Loading NVM..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm use 20 || true
    NODE_PATH=$(which node)
    echo "✅ Using Node.js: $NODE_PATH ($(node --version))"
    echo ""
    
    # Step 4: Stop PM2
    echo "🛑 Step 4: Stopping PM2..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    echo "✅ PM2 stopped"
    echo ""
    
    # Step 5: Install dependencies
    echo "📦 Step 5: Installing dependencies (5-10 minutes)..."
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps || {
        echo "❌ npm install failed"
        exit 1
    }
    echo "✅ Dependencies installed"
    echo ""
    
    # Step 6: Build
    echo "🔨 Step 6: Building application..."
    rm -rf .next out
    NODE_ENV=production npm run build || {
        echo "❌ Build failed"
        exit 1
    }
    echo "✅ Build completed"
    echo ""
    
    # Step 7: Create server.js
    echo "📝 Step 7: Creating server.js..."
    cat > server.js << 'EOFSERVER'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
EOFSERVER
    
    # Step 8: Create ecosystem.config.js
    NODE_PATH=$(which node)
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '${NODE_PATH}',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
EOF
    
    # Step 9: Start PM2
    mkdir -p logs
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup systemd -u root --hp /root || true
    
    # Step 10: Configure Nginx
    NGINX_CONF="/etc/nginx/sites-available/cryptorafts"
    cat > ${NGINX_CONF} << 'NGINXEOF'
server {
    listen 80;
    server_name cryptorafts.com www.cryptorafts.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF
    
    ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/cryptorafts
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx || true
    
    # Step 11: SSL
    certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect || true
    
    # Step 12: Firewall
    ufw allow OpenSSH || true
    ufw allow 'Nginx Full' || true
    ufw --force enable || true
    
    echo ""
    echo "========================================"
    echo "✅ DEPLOYMENT COMPLETE!"
    echo "========================================"
    echo ""
    echo "📊 PM2 Status:"
    pm2 status
    echo ""
    echo "🌐 Visit: https://cryptorafts.com"
    echo ""
    
else
    echo "❌ Files still NOT found!"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 FILES MUST BE UPLOADED VIA FILE MANAGER!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "The tar.gz extraction didn't work or files are missing."
    echo ""
    echo "You MUST upload files via Hostinger File Manager:"
    echo ""
    echo "1. Go to: https://hpanel.hostinger.com/"
    echo "2. Click 'File Manager'"
    echo "3. Navigate to: /var/www/cryptorafts"
    echo "4. Verify you're in correct directory (check breadcrumb)"
    echo "5. Upload from C:\\Users\\dell\\cryptorafts-starter:"
    echo "   ✅ src/ folder (ENTIRE folder)"
    echo "   ✅ package.json"
    echo "   ✅ next.config.js"
    echo "   ✅ tsconfig.json"
    echo ""
    echo "6. After upload, verify files appear in File Manager"
    echo "7. Then run this script again"
    echo ""
    exit 1
fi
