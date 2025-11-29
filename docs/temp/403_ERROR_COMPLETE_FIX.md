# 🔧 COMPLETE 403 ERROR FIX - Still Getting 403?

## ⚡ IMMEDIATE FIX - Run This on Your VPS

**If you're STILL seeing 403 Forbidden error, run this complete fix:**

---

## 🚀 QUICK FIX (Run on Your VPS)

### **Step 1: Upload Fix Script**

**On Windows:**
```powershell
cd C:\Users\dell\cryptorafts-starter
scp fix-403-complete.sh root@YOUR_VPS_IP:/var/www/cryptorafts/
```

### **Step 2: Run Fix Script**

**Connect to VPS:**
```bash
ssh root@YOUR_VPS_IP
cd /var/www/cryptorafts
chmod +x fix-403-complete.sh
sudo bash fix-403-complete.sh
```

**This will fix ALL possible causes of 403 error!**

---

## 🔍 WHY YOU'RE STILL SEEING 403

The 403 error happens because:

1. **Nginx is NOT proxying to Next.js** - It's trying to serve files directly
2. **App is NOT running** - Next.js app not started on port 3000
3. **Wrong permissions** - Files not accessible
4. **Wrong nginx config** - Missing proxy_pass directive

---

## 🛠️ MANUAL FIX (If Script Doesn't Work)

### **FIX 1: Check App is Running**

```bash
pm2 status
```

**If not running:**
```bash
cd /var/www/cryptorafts
pm2 start ecosystem.config.js
# OR if no ecosystem.config.js:
pm2 start server.js --name cryptorafts
pm2 save
```

**Verify app responds:**
```bash
curl http://localhost:3000
```

**Should see HTML output. If not, app isn't running!**

---

### **FIX 2: Check Nginx Configuration**

```bash
sudo cat /etc/nginx/sites-available/cryptorafts | grep -A 5 "location /"
```

**Should see:**
```nginx
location / {
    proxy_pass http://localhost:3000;
    ...
}
```

**If NOT there, update nginx config:**

```bash
sudo nano /etc/nginx/sites-available/cryptorafts
```

**Make sure it has:**
```nginx
server {
    listen 443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;

    # IMPORTANT: Proxy to Next.js
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
```

**Save and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### **FIX 3: Check Permissions**

```bash
cd /var/www/cryptorafts
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
# Also allow owner write
sudo chown -R $USER:$USER .
sudo chmod -R u+w .
```

---

### **FIX 4: Remove Default Nginx Site (If Interfering)**

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

### **FIX 5: Check Nginx Error Logs**

```bash
sudo tail -f /var/log/nginx/error.log
```

**Look for specific errors. Common issues:**
- "Permission denied" → Fix permissions
- "Connection refused" → App not running
- "No such file" → Wrong path

---

## ✅ COMPLETE CHECKLIST

**Verify each step:**

- [ ] **PM2 shows app running:** `pm2 status`
- [ ] **App responds on port 3000:** `curl http://localhost:3000` (shows HTML)
- [ ] **Nginx config has proxy_pass:** `grep "proxy_pass" /etc/nginx/sites-available/cryptorafts`
- [ ] **Site is enabled:** `ls -la /etc/nginx/sites-enabled/cryptorafts`
- [ ] **Nginx config valid:** `sudo nginx -t` (shows success)
- [ ] **Nginx reloaded:** `sudo systemctl reload nginx`
- [ ] **No default site:** `ls /etc/nginx/sites-enabled/` (no default)
- [ ] **Permissions correct:** `ls -la /var/www/cryptorafts` (www-data or your user)

---

## 🚨 IF STILL NOT WORKING

### **Check 1: App Port**

```bash
# Check if something is using port 3000
sudo netstat -tulpn | grep 3000

# Check PM2 is using port 3000
pm2 describe cryptorafts | grep PORT
```

### **Check 2: Firewall**

```bash
# Check if firewall is blocking
sudo ufw status
sudo ufw allow 3000/tcp
```

### **Check 3: Test Direct Access**

```bash
# Test if app works without nginx
curl http://localhost:3000

# If this works but website doesn't, it's nginx config issue
```

### **Check 4: Nginx Access Logs**

```bash
sudo tail -f /var/log/nginx/access.log
```

**Visit your site and see what nginx is logging.**

---

## 📋 ALTERNATIVE: Simplify Nginx Config

**If nothing works, use this minimal config:**

```bash
sudo nano /etc/nginx/sites-available/cryptorafts
```

**Replace with this minimal config:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Then:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Test with HTTP first:** http://www.cryptorafts.com (without HTTPS)

**If this works, then add SSL later.**

---

## 🎯 SUMMARY

**Most common cause of 403:**
- ❌ Nginx trying to serve files instead of proxying
- ❌ Next.js app not running on port 3000

**Quick fix:**
1. Make sure app runs: `pm2 start ecosystem.config.js`
2. Verify responds: `curl http://localhost:3000`
3. Fix nginx: Add `proxy_pass http://localhost:3000;`
4. Reload: `sudo systemctl reload nginx`

---

**Run the complete fix script: `fix-403-complete.sh` - it fixes everything! 🔧**

