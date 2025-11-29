# 🔍 DIAGNOSE WEBSITE PROBLEM - cryptorafts.com

## ⚠️ Troubleshooting Guide for https://www.cryptorafts.com/

This guide helps you diagnose and fix problems on your deployed website.

---

## 🔍 COMMON PROBLEMS & SOLUTIONS

### **Problem 1: 403 Forbidden Error**

**What you see:**
- "403 Forbidden"
- "nginx/1.18.0 (Ubuntu)"
- Website won't load

**Cause:**
- Nginx is blocking access
- Nginx not proxying to Next.js app
- App not running on port 3000

**Fix:**
```bash
# On your VPS:
cd /var/www/cryptorafts
chmod +x FIX_403_VPS_DIRECT.sh
sudo bash FIX_403_VPS_DIRECT.sh
```

**Or run these commands:**
```bash
# 1. Make sure app is running
pm2 status
# If not running:
pm2 start ecosystem.config.js
pm2 save

# 2. Check app responds
curl http://localhost:3000

# 3. Fix nginx config
sudo nano /etc/nginx/sites-available/cryptorafts
# Make sure location / has: proxy_pass http://localhost:3000;

# 4. Reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

### **Problem 2: 502 Bad Gateway Error**

**What you see:**
- "502 Bad Gateway"
- "nginx"
- Connection refused

**Cause:**
- Next.js app not running
- App crashed
- Port 3000 not accessible

**Fix:**
```bash
# Check if app is running
pm2 status

# If not running, start it
cd /var/www/cryptorafts
pm2 start ecosystem.config.js
pm2 save

# Check logs for errors
pm2 logs cryptorafts --lines 100

# Check if app responds
curl http://localhost:3000
```

---

### **Problem 3: 500 Internal Server Error**

**What you see:**
- "500 Internal Server Error"
- Application error

**Cause:**
- Application code error
- Missing environment variables
- Missing dependencies

**Fix:**
```bash
# Check logs
pm2 logs cryptorafts --lines 100

# Check .env.production exists and has correct keys
cd /var/www/cryptorafts
cat .env.production

# Rebuild application
npm run build

# Restart app
pm2 restart cryptorafts
```

---

### **Problem 4: SSL Certificate Error**

**What you see:**
- "Not Secure"
- SSL certificate warning
- HTTPS not working

**Cause:**
- SSL certificate not installed
- Certificate expired
- Wrong certificate

**Fix:**
```bash
# Install SSL certificate
sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com

# Renew certificate if expired
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

### **Problem 5: Website Shows "Cannot GET /"**

**What you see:**
- "Cannot GET /"
- Next.js error page

**Cause:**
- Application not built
- Wrong configuration
- Missing files

**Fix:**
```bash
cd /var/www/cryptorafts

# Switch to VPS config
cp next.config.vps.js next.config.js

# Build application
npm run build

# Restart app
pm2 restart cryptorafts
```

---

### **Problem 6: Website Shows Blank Page**

**What you see:**
- Blank page
- No content

**Cause:**
- JavaScript errors
- Missing dependencies
- Build issues

**Fix:**
```bash
# Check browser console (F12)
# Look for JavaScript errors

# Rebuild application
cd /var/www/cryptorafts
npm install --production
npm run build

# Check logs
pm2 logs cryptorafts --lines 100

# Restart app
pm2 restart cryptorafts
```

---

## 🔧 QUICK DIAGNOSTICS

**Run these commands on your VPS to diagnose:**

```bash
# 1. Check PM2 status
pm2 status

# 2. Check if app responds
curl http://localhost:3000

# 3. Check nginx status
sudo systemctl status nginx

# 4. Check nginx config
sudo nginx -t

# 5. Check nginx error log
sudo tail -50 /var/log/nginx/error.log

# 6. Check app logs
pm2 logs cryptorafts --lines 100

# 7. Check SSL certificate
sudo certbot certificates

# 8. Check permissions
ls -la /var/www/cryptorafts

# 9. Check if port 3000 is in use
sudo netstat -tulpn | grep 3000

# 10. Check nginx config for proxy_pass
sudo cat /etc/nginx/sites-available/cryptorafts | grep proxy_pass
```

---

## ✅ QUICK FIXES

### **Fix All Issues At Once:**

```bash
# On your VPS, run:
cd /var/www/cryptorafts

# If you have the complete deployment script:
chmod +x DEPLOY_ALL_TO_VPS.sh
sudo bash DEPLOY_ALL_TO_VPS.sh

# OR if you have the fix script:
chmod +x FIX_403_VPS_DIRECT.sh
sudo bash FIX_403_VPS_DIRECT.sh
```

---

## 🚨 MOST COMMON ISSUES

### **Issue 1: App Not Running**
**Symptoms:** 502 Bad Gateway, 403 Forbidden
**Fix:**
```bash
pm2 status
pm2 start ecosystem.config.js
pm2 save
```

### **Issue 2: Nginx Not Proxying**
**Symptoms:** 403 Forbidden
**Fix:**
```bash
sudo nano /etc/nginx/sites-available/cryptorafts
# Ensure: proxy_pass http://localhost:3000;
sudo nginx -t
sudo systemctl reload nginx
```

### **Issue 3: Missing Environment Variables**
**Symptoms:** 500 Error, blank page
**Fix:**
```bash
cd /var/www/cryptorafts
nano .env.production
# Add your Firebase keys
pm2 restart cryptorafts
```

---

## 📋 COMPLETE FIX CHECKLIST

**Run through these checks:**

- [ ] PM2 shows app running: `pm2 status`
- [ ] App responds on port 3000: `curl http://localhost:3000`
- [ ] Nginx config has `proxy_pass http://localhost:3000;`
- [ ] Nginx config valid: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] SSL certificate installed: `sudo certbot certificates`
- [ ] `.env.production` exists with Firebase keys
- [ ] Domain added to Firebase Authorized Domains
- [ ] Permissions correct: `ls -la /var/www/cryptorafts`
- [ ] No errors in logs: `pm2 logs cryptorafts`

---

## 🎯 TELL ME WHAT ERROR YOU SEE

**To help diagnose, please tell me:**

1. **What error message do you see?**
   - 403 Forbidden?
   - 502 Bad Gateway?
   - 500 Internal Server Error?
   - SSL Certificate Error?
   - Blank page?
   - Something else?

2. **What does the page show?**
   - Copy/paste the error message

3. **What does browser console show?**
   - Press F12 → Console tab
   - Any red errors?

4. **Have you run the deployment script?**
   - Did you run `DEPLOY_ALL_TO_VPS.sh`?
   - Did it complete successfully?

---

## 🚀 QUICK FIX - RUN THIS NOW

**If you're seeing 403 or any error, run this on your VPS:**

```bash
cd /var/www/cryptorafts

# Run complete fix
chmod +x FIX_403_VPS_DIRECT.sh
sudo bash FIX_403_VPS_DIRECT.sh

# OR run complete deployment
chmod +x DEPLOY_ALL_TO_VPS.sh
sudo bash DEPLOY_ALL_TO_VPS.sh
```

**This will fix most common issues!**

---

**Tell me what error you're seeing and I'll help you fix it! 🔧**

