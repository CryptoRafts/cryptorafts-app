# 🔧 QUICK FIX - IN YOUR SSH TERMINAL NOW

You're connected to SSH! Here's what to do:

## ⚠️ Problem: Files Not Uploaded Yet!

You need to:
1. **Upload files via FileZilla FIRST**
2. **Install Node.js/npm** (if not installed)
3. **Then run deployment commands**

---

## Step 1: Install Node.js in SSH Terminal

**In your SSH terminal (where you are now), run:**

```bash
# Check if Node.js is installed
node --version || echo "Node.js not installed"

# If not installed, install it:
# For CentOS/RHEL:
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# OR for Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 2: Create Directory

```bash
mkdir -p ~/cryptorafts
cd ~/cryptorafts
pwd
```

---

## Step 3: Upload Files via FileZilla

**BEFORE continuing, you MUST upload files!**

1. **Open FileZilla** (download if needed: https://filezilla-project.org/)
2. **Connect:**
   - Host: `sftp://145.79.211.130`
   - Port: `65002`
   - Username: `u386122906`
   - Password: `Shamsi2627@@`
3. **Upload:**
   - **FROM:** `C:\Users\dell\cryptorafts-starter`
   - **TO:** `/home/u386122906/cryptorafts/`
   - **IMPORTANT:** Upload the ENTIRE `src/` folder and all files!

---

## Step 4: Verify Files Are Uploaded

**Back in SSH terminal, check:**

```bash
cd ~/cryptorafts
ls -la src/app/page.tsx
```

**If file EXISTS:** Continue below  
**If file NOT FOUND:** Go back to Step 3 and upload files!

---

## Step 5: Install Dependencies

```bash
cd ~/cryptorafts
npm install --production
```

---

## Step 6: Build Application

```bash
rm -rf .next out
NODE_ENV=production npm run build
```

---

## Step 7: Create Server and Start PM2

```bash
# Create server.js
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

# Install PM2
sudo npm install -g pm2

# Start app
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
pm2 start server.js --name cryptorafts
pm2 save
```

---

## Step 8: Fix Nginx

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

---

## Step 9: Check Status

```bash
pm2 status
pm2 logs cryptorafts --lines 20 --nostream
curl -I http://localhost:3000
```

---

## Summary

1. ✅ **Install Node.js** (if not installed)
2. ✅ **Upload files via FileZilla**
3. ✅ **Run deployment commands**

---

## Done! ✅

Visit: **https://www.cryptorafts.com**

Clear browser cache: `Ctrl+Shift+Delete`  
Hard refresh: `Ctrl+F5`

