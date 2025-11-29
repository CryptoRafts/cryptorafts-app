# 📋 STEP-BY-STEP DEPLOYMENT GUIDE

## ⚠️ IMPORTANT: Run Commands in SSH Terminal, NOT PowerShell!

The commands I provided are for **SSH terminal (Linux)**, not PowerShell (Windows).

---

## Step 1: Upload Files via FileZilla

**First, you need to upload files to VPS:**

1. **Download FileZilla:** https://filezilla-project.org/
2. **Connect to VPS:**
   - Host: `sftp://145.79.211.130`
   - Port: `65002`
   - Username: `u386122906`
   - Password: `Shamsi2627@@`
   - Click **Quickconnect**

3. **Navigate folders:**
   - **LEFT side (Local):** Navigate to `C:\Users\dell\cryptorafts-starter`
   - **RIGHT side (Remote):** Navigate to `/home/u386122906/`
     - If `cryptorafts` folder doesn't exist, right-click → Create Directory → Type: `cryptorafts`
     - Then navigate into `/home/u386122906/cryptorafts/`

4. **Upload files:**
   - **IMPORTANT:** Upload the ENTIRE `src/` folder
   - Right-click on `src` folder → Upload
   - Also upload: `package.json`, `next.config.js`, and all other files

---

## Step 2: SSH to VPS (Connect Again)

**In PowerShell (Windows), connect to VPS:**

```powershell
ssh -p 65002 u386122906@145.79.211.130
```

**Enter password:** `Shamsi2627@@`

**You should see:** `[u386122906@... ~]$`

This is the **SSH terminal (Linux)** where you run the commands!

---

## Step 3: Run Commands in SSH Terminal

**Now, in the SSH terminal (NOT PowerShell), run these commands ONE BY ONE:**

### 1. Navigate to directory
```bash
cd ~/cryptorafts
```

### 2. Check if files exist
```bash
ls -la src/app/page.tsx
```

**If file NOT found:** Go back to Step 1 and upload files first!  
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
```

---

## Summary

1. ✅ **Upload files** via FileZilla
2. ✅ **SSH to VPS** in PowerShell: `ssh -p 65002 u386122906@145.79.211.130`
3. ✅ **Run commands** in SSH terminal (Linux), not PowerShell!

---

## Troubleshooting

**If you see `cd: Cannot find path`:**  
→ You're in PowerShell, not SSH terminal!  
→ Connect to SSH first: `ssh -p 65002 u386122906@145.79.211.130`

**If you see `src/app/page.tsx` not found:**  
→ Files not uploaded yet!  
→ Go to Step 1 and upload files via FileZilla first!

---

## Done! ✅

Visit: **https://www.cryptorafts.com**

Clear browser cache: `Ctrl+Shift+Delete`  
Hard refresh: `Ctrl+F5`

