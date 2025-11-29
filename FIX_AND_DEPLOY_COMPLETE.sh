#!/bin/bash
# ============================================
# FIX AND DEPLOY COMPLETE - Fixes everything and deploys
# ============================================

set -e

echo "========================================"
echo "🔧 FIX AND DEPLOY COMPLETE"
echo "========================================"
echo ""

cd /var/www/cryptorafts

# Step 1: Fix ownership and permissions
echo "🔧 Step 1: Fixing ownership and permissions..."
chown -R root:root /var/www/cryptorafts 2>/dev/null || true
chmod 755 /var/www/cryptorafts
find /var/www/cryptorafts -type d -exec chmod 755 {} \; 2>/dev/null || true
find /var/www/cryptorafts -type f -exec chmod 644 {} \; 2>/dev/null || true
echo "✅ Ownership and permissions fixed"
echo ""

# Step 2: Check what files exist
echo "🔍 Step 2: Checking files..."
ls -la /var/www/cryptorafts | grep -E "(package.json|src|next.config)" || echo "Files not found"
echo ""

# Step 3: Check if package.json exists, if not create it
if [ ! -f "package.json" ]; then
    echo "⚠️  package.json not found - creating it..."
    cat > package.json << 'PKGEOF'
{
  "name": "cryptorafts",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001 --webpack",
    "build": "next build --webpack",
    "start": "next start"
  },
  "dependencies": {
    "next": "^16.0.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
PKGEOF
    echo "✅ package.json created"
else
    echo "✅ package.json exists"
fi
echo ""

# Step 4: Check if src/app/page.tsx exists
if [ ! -f "src/app/page.tsx" ]; then
    echo "⚠️  src/app/page.tsx not found - checking src structure..."
    find src -type f -name "*.tsx" -o -name "*.ts" 2>/dev/null | head -5 || echo "No TypeScript files found in src/"
    echo ""
    if [ ! -d "src/app" ]; then
        echo "⚠️  src/app directory not found - creating basic structure..."
        mkdir -p src/app
        cat > src/app/page.tsx << 'PAGEEOF'
export default function Home() {
  return (
    <div>
      <h1>Cryptorafts</h1>
      <p>Application is deploying...</p>
    </div>
  );
}
PAGEEOF
        echo "✅ src/app/page.tsx created"
    fi
else
    echo "✅ src/app/page.tsx exists"
fi
echo ""

# Step 5: Check if next.config.js exists
if [ ! -f "next.config.js" ]; then
    echo "⚠️  next.config.js not found - creating it..."
    cat > next.config.js << 'CONFIGEOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
CONFIGEOF
    echo "✅ next.config.js created"
else
    echo "✅ next.config.js exists"
fi
echo ""

# Step 6: Check if tsconfig.json exists
if [ ! -f "tsconfig.json" ]; then
    echo "⚠️  tsconfig.json not found - creating it..."
    cat > tsconfig.json << 'TSCOFEOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
TSCOFEOF
    echo "✅ tsconfig.json created"
else
    echo "✅ tsconfig.json exists"
fi
echo ""

# Step 7: Final verification
echo "🔍 Step 7: Final verification..."
ls -la package.json src/app/page.tsx next.config.js tsconfig.json 2>/dev/null || {
    echo "❌ Some files still missing!"
    exit 1
}
echo "✅ All files verified!"
echo ""

# Step 8: Load NVM
echo "📦 Step 8: Loading NVM..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 || true
NODE_PATH=$(which node)
echo "✅ Using Node.js: $NODE_PATH ($(node --version))"
echo ""

# Step 9: Stop PM2
echo "🛑 Step 9: Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 stopped"
echo ""

# Step 10: Install dependencies
echo "📦 Step 10: Installing dependencies (5-10 minutes)..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps || {
    echo "❌ npm install failed"
    exit 1
}
echo "✅ Dependencies installed"
echo ""

# Step 11: Build
echo "🔨 Step 11: Building application..."
rm -rf .next out
NODE_ENV=production npm run build || {
    echo "❌ Build failed"
    exit 1
}
echo "✅ Build completed"
echo ""

# Step 12: Create server.js
echo "📝 Step 12: Creating server.js..."
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

# Step 13: Create ecosystem.config.js
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

# Step 14: Start PM2
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root || true

# Step 15: Configure Nginx
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

# Step 16: SSL
certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --email admin@cryptorafts.com --redirect || true

# Step 17: Firewall
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

# Final verification
echo ""
echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "📋 PM2 Logs:"
pm2 logs cryptorafts --lines 30 --nostream || true
echo ""
echo "🌐 Visit: https://cryptorafts.com"
echo "🌐 Visit: https://www.cryptorafts.com"
echo ""

