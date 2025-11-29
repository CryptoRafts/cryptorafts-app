# 🚀 DEPLOY NOW - QUICK GUIDE

## ⚡ 3 STEPS TO MAKE IT LIVE

### **Step 1: Get SSH Credentials** (5 minutes)

**If you don't have SSH credentials yet:**

**Option A: Email Hostinger Support** (5-10 min wait)
- 📧 **Email:** support@hostinger.com
- 📝 **Subject:** "SSH credentials VPS #1097850"
- 📝 **Message:** "I need SSH credentials to deploy my application. Please provide IP address, username (root), and password."

**Option B: Get from Hostinger Panel** (2 min)
- 🌐 Go to: https://hpanel.hostinger.com/vps/1097850/overview
- 🔐 Login to your Hostinger account
- 📋 Find "SSH Access" or "Server Details" section
- 📝 Note down:
  - **IP Address:** (e.g., 185.xxx.xxx.xxx)
  - **Username:** (usually `root`)
  - **Password:** (your VPS password)

---

### **Step 2: Run Deployment Script** (10 minutes)

**On PowerShell, run:**

```powershell
.\GET_SSH_AND_DEPLOY.ps1
```

**The script will:**
1. Ask for VPS IP address → **Enter IP from Hostinger**
2. Ask for SSH password → **Enter password from Hostinger**
3. Upload all files automatically
4. Deploy on VPS automatically
5. Make website LIVE

**Wait 8-10 minutes for script to complete**

---

### **Step 3: Configure & Done!** (5 minutes)

**After deployment completes:**

```bash
# Connect to VPS
ssh root@YOUR_VPS_IP

# Configure Firebase keys
cd /var/www/cryptorafts
nano .env.production
# Add your Firebase keys, then save (Ctrl+X, Y, Enter)

# Restart app
pm2 restart cryptorafts

# Add domain to Firebase
# Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
# Add: cryptorafts.com
# Add: www.cryptorafts.com
```

**Visit: https://www.cryptorafts.com**
**Done! Your app is LIVE! 🎉**

---

## ✅ SUMMARY

**Total Time:** 15-20 minutes

**What You Need:**
- ✅ SSH credentials (IP, username, password)
- ✅ Firebase keys (for .env.production)
- ✅ 15-20 minutes

**What Script Does:**
- ✅ Uploads all files
- ✅ Installs Node.js, PM2, Nginx, Certbot
- ✅ Builds application
- ✅ Starts app with PM2
- ✅ Configures Nginx
- ✅ Sets up SSL
- ✅ Fixes 403 error

**After Script:**
- ✅ Configure Firebase keys
- ✅ Add domain to Firebase
- ✅ Visit: https://www.cryptorafts.com

---

**Run `.\GET_SSH_AND_DEPLOY.ps1` and your app will be LIVE! 🚀**

