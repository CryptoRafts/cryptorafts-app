#!/bin/bash
# ============================================
# SIMPLE DEPLOYMENT COMMANDS
# ============================================
# Copy and paste these commands ONE BY ONE into your SSH terminal

# STEP 1: Navigate to app directory
cd ~/cryptorafts || cd /var/www/cryptorafts || mkdir -p ~/cryptorafts && cd ~/cryptorafts

# STEP 2: Check if files exist
ls -la src/app/page.tsx

# If file NOT found, upload files via FileZilla first!
# If file exists, continue below:

# STEP 3: Install dependencies
npm install --production

# STEP 4: Build application
rm -rf .next out
NODE_ENV=production npm run build

# STEP 5: Create server.js
cat > server.js << 'EOF'
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
EOF

# STEP 6: Install PM2
sudo npm install -g pm2 || npm install -g pm2

# STEP 7: Start with PM2
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
pm2 start server.js --name cryptorafts
pm2 save

# STEP 8: Fix Nginx
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
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    location / {
        proxy_pass http://localhost:3000;
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
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# STEP 9: Check status
pm2 status
pm2 logs cryptorafts --lines 20 --nostream
curl -I http://localhost:3000

# DONE!
echo "✅ Deployment complete! Visit https://www.cryptorafts.com"

