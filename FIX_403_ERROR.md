# 🔧 FIX 403 FORBIDDEN ERROR - Complete Deployment

## Your site shows 403 Forbidden - Here's how to fix it!

The 403 error means nginx is blocking access. This happens when:
- Wrong file permissions
- Wrong nginx configuration
- Next.js app not running
- Wrong proxy configuration

---

## ⚡ QUICK FIX (Run on your VPS)

**Connect to your VPS:**
```bash
ssh root@YOUR_VPS_IP
```

**Run this fix script:**
```bash
cd /var/www/cryptorafts

# Upload fix-403-deployment.sh first, then:
chmod +x fix-403-deployment.sh
sudo bash fix-403-deployment.sh
```

**OR run these commands manually:**

---

## 🔧 STEP-BY-STEP FIX

### **STEP 1: Fix Directory Permissions**

```bash
cd /var/www/cryptorafts
sudo chown -R www-data:www-data /var/www/cryptorafts
sudo chmod -R 755 /var/www/cryptorafts
```

---

### **STEP 2: Check Next.js App is Running**

```bash
pm2 status
```

**If not running:**
```bash
cd /var/www/cryptorafts

# Switch to VPS config
cp next.config.vps.js next.config.js

# Install dependencies if needed
npm install --production

# Build if needed
npm run build

# Start with PM2
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Run the command it shows
```

---

### **STEP 3: Fix Nginx Configuration**

**Create/Update nginx config:**

```bash
sudo nano /etc/nginx/sites-available/cryptorafts
```

**Paste this configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    # SSL (set by certbot)
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # IMPORTANT: Proxy to Next.js app (port 3000)
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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
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
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

---

### **STEP 4: Enable Site**

```bash
sudo ln -s /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/
```

---

### **STEP 5: Test and Reload Nginx**

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

### **STEP 6: Verify Everything is Working**

```bash
# Check Next.js app is running
pm2 status

# Check app responds
curl http://localhost:3000

# Check nginx is running
sudo systemctl status nginx

# Check nginx logs if needed
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ AFTER FIXING

**Visit:** https://www.cryptorafts.com

**Should see:**
- ✅ Website loads (no 403 error)
- ✅ HTTPS active (🔒 padlock)
- ✅ Homepage displays correctly
- ✅ Login works

---

## 🚨 IF STILL SEEING 403

### **Check 1: App is Running**

```bash
pm2 status
pm2 logs cryptorafts
```

**If not running:**
```bash
cd /var/www/cryptorafts
pm2 start ecosystem.config.js
pm2 save
```

### **Check 2: Port 3000 is Accessible**

```bash
curl http://localhost:3000
```

**Should see HTML output. If not, app isn't running correctly.**

### **Check 3: Nginx Configuration**

```bash
sudo nginx -t
sudo cat /etc/nginx/sites-available/cryptorafts
```

**Make sure `proxy_pass http://localhost:3000;` is set.**

### **Check 4: Permissions**

```bash
sudo chown -R www-data:www-data /var/www/cryptorafts
sudo chmod -R 755 /var/www/cryptorafts
ls -la /var/www/cryptorafts
```

### **Check 5: Nginx Error Logs**

```bash
sudo tail -f /var/log/nginx/error.log
```

**Look for specific error messages.**

---

## 📋 COMPLETE DEPLOYMENT CHECKLIST

- [ ] Directory permissions fixed (`chown www-data:www-data`)
- [ ] Next.js app running (`pm2 status` shows running)
- [ ] App responds on port 3000 (`curl http://localhost:3000`)
- [ ] Nginx configuration correct (proxy to port 3000)
- [ ] Nginx site enabled (symlink exists)
- [ ] Nginx configuration valid (`nginx -t` succeeds)
- [ ] Nginx reloaded (`systemctl reload nginx`)
- [ ] SSL certificate installed
- [ ] Website accessible at https://www.cryptorafts.com
- [ ] No 403 errors

---

## 🎊 DEPLOYMENT COMPLETE!

Once all steps are done:

**🌐 Your CryptoRafts is LIVE at:**
https://www.cryptorafts.com

**Features:**
- ✅ No 403 errors
- ✅ Full Next.js application
- ✅ Firebase authentication
- ✅ SSL/HTTPS enabled
- ✅ Production-ready

---

**Run the fix script or follow the steps above to fix the 403 error! 🔧**

