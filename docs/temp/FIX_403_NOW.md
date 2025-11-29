# 🔧 FIX 403 ERROR NOW - Quick Solution

## ⚠️ PROBLEM IDENTIFIED

**Your website shows:**
- ❌ **403 Forbidden**
- ❌ **nginx/1.18.0 (Ubuntu)**
- ❌ Website won't load

**Cause:** Nginx is not proxying to your Next.js app on port 3000

---

## ✅ QUICK FIX (5 Minutes)

### **Step 1: Connect to Your VPS**

**In PowerShell:**
```powershell
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

**Need SSH credentials?**
- Contact Hostinger: support@hostinger.com
- Ask for: SSH credentials for VPS #1097850

---

### **Step 2: Run the Fix Script**

**Once connected to VPS:**
```bash
cd /var/www/cryptorafts

# Make script executable
chmod +x FIX_403_VPS_DIRECT.sh

# Run the fix
sudo bash FIX_403_VPS_DIRECT.sh
```

**This script will:**
- ✅ Fix all permissions
- ✅ Ensure app is running on port 3000
- ✅ Configure Nginx to proxy to your app
- ✅ Reload Nginx
- ✅ Verify everything works

**Wait for script to complete (2-3 minutes)**

---

### **Step 3: Verify Fix**

**After script completes:**
```bash
# Check app is running
pm2 status

# Check app responds
curl http://localhost:3000

# Check nginx config
sudo nginx -t
sudo systemctl status nginx
```

---

### **Step 4: Test Website**

**Open in browser:**
- Visit: https://www.cryptorafts.com
- Should now load correctly!
- No more 403 error!

---

## 🚨 IF FIX SCRIPT NOT AVAILABLE

**If you don't have the fix script, run these commands manually:**

```bash
# 1. Navigate to app directory
cd /var/www/cryptorafts

# 2. Fix permissions
sudo chown -R www-data:www-data /var/www/cryptorafts
sudo chmod -R 755 /var/www/cryptorafts

# 3. Make sure app is running
pm2 status
# If not running:
pm2 start ecosystem.config.js
pm2 save

# 4. Check app responds
curl http://localhost:3000
# Should show HTML output

# 5. Fix nginx config
sudo nano /etc/nginx/sites-available/cryptorafts
```

**In nginx config, make sure `location /` has:**
```nginx
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
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

**Then:**
```bash
# 6. Test nginx config
sudo nginx -t

# 7. Reload nginx
sudo systemctl reload nginx

# 8. Verify
curl http://localhost:3000
```

---

## ✅ COMPLETE FIX CHECKLIST

**Run through these checks:**

- [ ] Connected to VPS via SSH
- [ ] Ran `FIX_403_VPS_DIRECT.sh` script
- [ ] Script completed successfully
- [ ] `pm2 status` shows app running
- [ ] `curl http://localhost:3000` responds
- [ ] `sudo nginx -t` shows "syntax is ok"
- [ ] `sudo systemctl reload nginx` completed
- [ ] Website loads at https://www.cryptorafts.com
- [ ] NO 403 error!

---

## 🎯 WHAT THE FIX DOES

The fix script:

1. **Fixes Permissions:**
   - Sets correct ownership
   - Sets correct permissions

2. **Starts Application:**
   - Ensures Next.js app is running on port 3000
   - Uses PM2 to manage the app

3. **Configures Nginx:**
   - Sets up proxy to `http://localhost:3000`
   - Configures all necessary headers
   - Enables the site

4. **Reloads Nginx:**
   - Tests configuration
   - Reloads Nginx

---

## 🚀 QUICKEST FIX

**If you just want to fix it NOW:**

```bash
# Connect to VPS
ssh root@YOUR_VPS_IP

# Run this ONE command
cd /var/www/cryptorafts && chmod +x FIX_403_VPS_DIRECT.sh && sudo bash FIX_403_VPS_DIRECT.sh
```

**Done! Website should work in 2-3 minutes! ✅**

---

**Run the fix script and your website will work! 🚀**

