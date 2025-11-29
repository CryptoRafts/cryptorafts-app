# 📋 COPY AND PASTE THESE COMMANDS

## Step 1: Upload Files First

**Use FileZilla:**
1. Download: https://filezilla-project.org/
2. Connect: `sftp://145.79.211.130:65002`
3. Username: `u386122906`
4. Password: `Shamsi2627@@`
5. Upload ALL files from `C:\Users\dell\cryptorafts-starter` to `/home/u386122906/cryptorafts/`

---

## Step 2: Copy and Paste These Commands in SSH Terminal

Copy and paste these commands ONE BY ONE into your SSH terminal:

### 1. Navigate to directory
```bash
cd ~/cryptorafts
```

### 2. Check if files exist
```bash
ls -la src/app/page.tsx
```

**If file NOT found:** Upload files via FileZilla first!

**If file EXISTS:** Continue below ↓

### 3. Install dependencies
```bash
npm install --production
```

### 4. Build application
```bash
rm -rf .next out
NODE_ENV=production npm run build
```

### 5. Create server.js
```bash
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
```

### 6. Install PM2
```bash
sudo npm install -g pm2
```

### 7. Start app with PM2
```bash
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
pm2 start server.js --name cryptorafts
pm2 save
```

### 8. Fix Nginx
```bash
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
```

### 9. Check status
```bash
pm2 status
pm2 logs cryptorafts --lines 20 --nostream
curl -I http://localhost:3000
```

---

## Done! ✅

Visit: **https://www.cryptorafts.com**

Clear browser cache: `Ctrl+Shift+Delete`
Hard refresh: `Ctrl+F5`

