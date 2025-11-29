# 🚀 DEPLOY TO HOSTINGER VPS - NOW

## ⚡ Complete Deployment Guide

This guide will help you deploy your CryptoRafts app to Hostinger VPS.

---

## ✅ PRE-REQUISITES

**You need:**
- ✅ SSH credentials from Hostinger (IP, username, password)
- ✅ All files in your project folder
- ✅ VPS is running and accessible

---

## 🚀 STEP 1: GET SSH CREDENTIALS (2 minutes)

**Contact Hostinger Support:**
- **Email:** support@hostinger.com
- **Subject:** "Need SSH credentials for VPS #1097850"
- **They'll provide:**
  - IP Address: `xxx.xxx.xxx.xxx`
  - Username: `root`
  - Password: `your-password`

**Save these credentials!**

---

## 🚀 STEP 2: PREPARE FILES LOCALLY (5 minutes)

**On your Windows machine:**

```powershell
# Make sure you're in project directory
cd C:\Users\dell\cryptorafts-starter

# Ensure VPS config is active
Copy-Item next.config.vps.js next.config.js -Force

# Verify you have these files:
# ✅ DEPLOY_ALL_TO_VPS.sh
# ✅ FIX_403_VPS_DIRECT.sh
# ✅ server.js
# ✅ ecosystem.config.js
# ✅ next.config.js (VPS config)
```

---

## 🚀 STEP 3: UPLOAD FILES TO VPS (10 minutes)

**Option A: Using SCP (PowerShell)**

```powershell
# Navigate to project directory
cd C:\Users\dell\cryptorafts-starter

# Upload ALL files to VPS
scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/

# Enter password when prompted
```

**Option B: Using WinSCP (GUI)**

1. Download WinSCP: https://winscp.net/
2. Connect to your VPS:
   - Host: `YOUR_VPS_IP`
   - Username: `root`
   - Password: `your-password`
3. Navigate to `/var/www/cryptorafts/`
4. Upload ALL files from your project folder

---

## 🚀 STEP 4: RUN DEPLOYMENT SCRIPT (10 minutes)

**Connect to your VPS via SSH:**

```powershell
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

**Once connected, run:**

```bash
# Navigate to app directory
cd /var/www/cryptorafts

# Make scripts executable
chmod +x DEPLOY_ALL_TO_VPS.sh
chmod +x FIX_403_VPS_DIRECT.sh

# Run complete deployment script
sudo bash DEPLOY_ALL_TO_VPS.sh
```

**This script will:**
- ✅ Install Node.js 18.x
- ✅ Install PM2
- ✅ Install Nginx
- ✅ Install Certbot
- ✅ Fix all permissions
- ✅ Install dependencies
- ✅ Build application
- ✅ Start application with PM2
- ✅ Configure Nginx
- ✅ Setup SSL certificate
- ✅ Verify everything works

**Wait for script to complete (8-10 minutes)**

---

## 🚀 STEP 5: CONFIGURE ENVIRONMENT (5 minutes)

**After deployment completes:**

```bash
cd /var/www/cryptorafts

# Edit environment file
nano .env.production
```

**Add your Firebase keys:**

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
OPENAI_API_KEY=your_actual_openai_key
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

**Restart app:**
```bash
pm2 restart cryptorafts
```

---

## 🚀 STEP 6: ADD DOMAIN TO FIREBASE (5 minutes)

**Go to Firebase Console:**
1. Visit: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add: `cryptorafts.com`
5. Add again: `www.cryptorafts.com`

**This is required for authentication to work!**

---

## 🚀 STEP 7: VERIFY DEPLOYMENT (2 minutes)

**Check everything is working:**

```bash
# Check PM2 status
pm2 status

# Check app responds
curl http://localhost:3000

# Check nginx status
sudo systemctl status nginx

# Check nginx config
sudo nginx -t
```

**Visit in browser:**
- 🌐 https://www.cryptorafts.com
- Should load correctly!
- ✅ NO 403 error!
- ✅ HTTPS working (🔒 padlock)

---

## 🔧 IF YOU SEE 403 ERROR

**Run the fix script:**

```bash
cd /var/www/cryptorafts
sudo bash FIX_403_VPS_DIRECT.sh
```

**This will fix:**
- ✅ Permissions
- ✅ Nginx configuration
- ✅ App startup
- ✅ SSL certificate

**Wait 2-3 minutes, then visit website again**

---

## ✅ DEPLOYMENT COMPLETE!

**Once all steps are done:**

✅ **Your CryptoRafts is LIVE at:**
🌐 https://www.cryptorafts.com

**Features Active:**
- ✅ Full Next.js application with SSR
- ✅ All API routes working
- ✅ Firebase authentication
- ✅ Real-time features
- ✅ SSL/HTTPS enabled
- ✅ Auto-restart on crash (PM2)
- ✅ Production-ready

---

## 📊 USEFUL COMMANDS

**On your VPS:**

```bash
# Check app status
pm2 status

# View logs
pm2 logs cryptorafts

# Restart app
pm2 restart cryptorafts

# Check nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl reload nginx

# Check if app responds
curl http://localhost:3000

# View nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## 🚨 TROUBLESHOOTING

### **Script fails during installation?**
```bash
# Install manually:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### **Application not starting?**
```bash
pm2 logs cryptorafts --lines 100
# Check for errors and fix them
```

### **Still seeing 403 error?**
```bash
# Check nginx config
sudo cat /etc/nginx/sites-available/cryptorafts | grep proxy_pass
# Should see: proxy_pass http://localhost:3000;

# Restart everything
pm2 restart cryptorafts
sudo systemctl reload nginx
```

---

**Follow these steps and your app will be LIVE! 🚀**

