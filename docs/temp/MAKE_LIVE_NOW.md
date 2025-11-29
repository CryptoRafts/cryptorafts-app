# 🚀 MAKE YOUR APP LIVE NOW - SIMPLE STEPS

## ⚡ 3 STEPS TO MAKE IT LIVE - 10 MINUTES

### **Step 1: Get SSH Credentials** (5 minutes)

**If you don't have SSH credentials yet:**

📧 **Email Hostinger Support:**
- **Email:** support@hostinger.com
- **Subject:** "SSH credentials for VPS #1097850"
- **Message:** "I need SSH credentials to deploy my application. Please provide IP address, username, and password."

**They'll respond in 5-10 minutes with:**
- IP Address: `xxx.xxx.xxx.xxx`
- Username: `root`
- Password: `your-password`

---

### **Step 2: Run Deployment Script** (8 minutes)

**On Windows PowerShell, run:**

```powershell
cd C:\Users\dell\cryptorafts-starter
.\DEPLOY_COMPLETE_AUTO.ps1
```

**Enter when prompted:**
- VPS IP Address: `(from Hostinger)`
- SSH Password: `(from Hostinger)`

**The script will automatically:**
- ✅ Upload all files to VPS
- ✅ Connect to VPS
- ✅ Install Node.js, PM2, Nginx, Certbot
- ✅ Build your application
- ✅ Start app with PM2
- ✅ Configure Nginx (fixes 403 error)
- ✅ Setup SSL certificate
- ✅ Make website LIVE

**Wait 8-10 minutes for script to complete**

---

### **Step 3: Configure & Done!** (2 minutes)

**After script completes:**

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
# Scroll to "Authorized domains"
# Click "Add domain"
# Add: cryptorafts.com
# Add again: www.cryptorafts.com
```

**Visit: https://www.cryptorafts.com**
**Your app is LIVE! 🎉**

---

## 🚀 ALTERNATIVE: Manual Deployment

**If automated script doesn't work:**

```powershell
# 1. Upload files
scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/

# 2. Connect to VPS
ssh root@YOUR_VPS_IP

# 3. Deploy
cd /var/www/cryptorafts
chmod +x DEPLOY_FASTEST.sh
sudo bash DEPLOY_FASTEST.sh
```

**Wait 8 minutes, then visit: https://www.cryptorafts.com**

---

## ✅ CHECKLIST

**Before deployment:**
- [ ] Have SSH credentials (IP, username, password)
- [ ] All files ready in project folder
- [ ] DEPLOY_FASTEST.sh exists
- [ ] DEPLOY_COMPLETE_AUTO.ps1 exists

**During deployment:**
- [ ] Files uploaded to VPS
- [ ] Deployment script running
- [ ] Script completed successfully

**After deployment:**
- [ ] App running (`pm2 status`)
- [ ] Nginx configured (`sudo nginx -t`)
- [ ] Website accessible (https://www.cryptorafts.com)
- [ ] NO 403 error!

---

## 🌐 YOUR WEBSITE WILL BE LIVE AT:

**https://www.cryptorafts.com**

**After deployment completes!**

---

## 🚨 TROUBLESHOOTING

### **If you see 403 error:**
```bash
ssh root@YOUR_VPS_IP
cd /var/www/cryptorafts
sudo bash FIX_403_VPS_DIRECT.sh
```

### **If script fails:**
```bash
ssh root@YOUR_VPS_IP
cd /var/www/cryptorafts
chmod +x DEPLOY_FASTEST.sh
sudo bash DEPLOY_FASTEST.sh
```

---

**Run `.\DEPLOY_COMPLETE_AUTO.ps1` and your app will be LIVE in 10 minutes! 🚀**

