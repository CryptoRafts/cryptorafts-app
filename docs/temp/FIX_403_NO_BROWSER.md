# 🔧 FIX 403 ERROR - NO BROWSER NEEDED

## ⚡ Complete Fix Using SSH Only - No Browser Required

Since browser authentication is blocked, we'll fix everything directly on your VPS via SSH.

---

## 🚀 QUICK FIX (5 Minutes)

### **STEP 1: Get SSH Credentials**

**Option A: Contact Hostinger Support**
- Email: support@hostinger.com
- Ask for: SSH credentials for VPS #1097850
- They'll provide: IP Address, Username (root), Password

**Option B: Check Hostinger Email**
- Look for welcome email with SSH details
- Or check your Hostinger account email

**Option C: Hostinger Panel** (if you can access)
- Login: https://hpanel.hostinger.com/vps/1097850/overview
- Find: "SSH Access" section

---

### **STEP 2: Upload Fix Script**

**On Windows PowerShell:**

```powershell
cd C:\Users\dell\cryptorafts-starter

# Upload fix script
scp FIX_403_VPS_DIRECT.sh root@YOUR_VPS_IP:/var/www/cryptorafts/
```

**Replace `YOUR_VPS_IP` with your actual VPS IP address.**

---

### **STEP 3: Connect and Run Fix**

**Connect via SSH:**
```bash
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

**Once connected:**
```bash
cd /var/www/cryptorafts

# Make script executable
chmod +x FIX_403_VPS_DIRECT.sh

# Run complete fix
sudo bash FIX_403_VPS_DIRECT.sh
```

**This will:**
- ✅ Fix all permissions
- ✅ Start/restart Next.js app
- ✅ Fix nginx configuration (proxy to port 3000)
- ✅ Reload nginx
- ✅ Setup SSL if needed
- ✅ Verify everything

---

## 🔧 MANUAL FIX (If Script Doesn't Work)

**Run these commands on your VPS:**

```bash
cd /var/www/cryptorafts

# 1. Fix permissions
sudo chown -R www-data:www-data .
sudo chmod -R 755 .

# 2. Start app
pm2 status
# If not running:
cp next.config.vps.js next.config.js
npm install --production
npm run build
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save

# 3. Fix nginx - CRITICAL!
sudo nano /etc/nginx/sites-available/cryptorafts
```

**In nano editor, make sure location / has:**
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

**Then:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ VERIFY FIX

**After running fix:**

```bash
# Check app is running
pm2 status

# Check app responds
curl http://localhost:3000

# Check nginx
sudo systemctl status nginx
```

**Then visit:** https://www.cryptorafts.com

**Should see:**
- ✅ Website loads (no 403 error)
- ✅ HTTPS active
- ✅ Homepage displays correctly

---

## 🚨 IF STILL SEEING 403

**Run these diagnostics:**

```bash
# 1. Is app running?
pm2 status
pm2 logs cryptorafts --lines 50

# 2. Does app respond?
curl http://localhost:3000
# Should see HTML output. If not, app isn't running!

# 3. Check nginx config
sudo cat /etc/nginx/sites-available/cryptorafts | grep proxy_pass
# Should see: proxy_pass http://localhost:3000;

# 4. Check nginx error log
sudo tail -50 /var/log/nginx/error.log

# 5. Check if site is enabled
ls -la /etc/nginx/sites-enabled/
# Should see cryptorafts link

# 6. Test nginx config
sudo nginx -t
# Should say: "test is successful"
```

---

## 📋 MOST COMMON ISSUES

### **Issue 1: App Not Running**
**Fix:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 logs cryptorafts
```

### **Issue 2: Nginx Not Proxying**
**Fix:**
```bash
sudo nano /etc/nginx/sites-available/cryptorafts
# Make sure it has: proxy_pass http://localhost:3000;
sudo nginx -t
sudo systemctl reload nginx
```

### **Issue 3: Wrong Permissions**
**Fix:**
```bash
sudo chown -R www-data:www-data /var/www/cryptorafts
sudo chmod -R 755 /var/www/cryptorafts
```

---

## 🎯 SUMMARY

**To fix 403 error:**

1. **Upload:** `FIX_403_VPS_DIRECT.sh` to your VPS
2. **Run:** `sudo bash FIX_403_VPS_DIRECT.sh` on your VPS
3. **Verify:** Visit https://www.cryptorafts.com

**No browser needed - everything done via SSH!**

---

## 📞 NEED SSH CREDENTIALS?

**Contact Hostinger:**
- **Email:** support@hostinger.com
- **Chat:** Available in Hostinger panel (if accessible)
- **Tell them:** Need SSH credentials for VPS #1097850

**Or check:**
- Hostinger welcome email
- Hostinger panel (if you can access it)

---

**Run the fix script on your VPS and the 403 error will be fixed! 🔧**

