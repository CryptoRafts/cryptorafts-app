# 🚀 DEPLOY TO HOSTINGER NOW - SIMPLE STEPS

## ⚡ 3 SIMPLE STEPS - 10 MINUTES

### **Step 1: Get SSH Credentials** (5 minutes)

**Email Hostinger Support:**
- **Email:** support@hostinger.com
- **Subject:** "SSH credentials VPS #1097850"
- **They'll provide:**
  - IP Address: `xxx.xxx.xxx.xxx`
  - Username: `root`
  - Password: `your-password`

---

### **Step 2: Upload & Deploy** (10 minutes)

**On Windows PowerShell, run these commands:**

```powershell
cd C:\Users\dell\cryptorafts-starter

# Option A: Use automated script (asks for credentials)
.\DEPLOY_TO_HOSTINGER.ps1

# Option B: Manual deployment
# 1. Upload files
scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/

# 2. Connect to VPS
ssh root@YOUR_VPS_IP

# 3. Deploy
cd /var/www/cryptorafts
chmod +x DEPLOY_FASTEST.sh
sudo bash DEPLOY_FASTEST.sh
```

**Wait 8 minutes for script to complete**

---

### **Step 3: Done!** (2 minutes)

**After script completes:**

```bash
# Configure Firebase keys
nano .env.production
# Add your Firebase keys, then:
pm2 restart cryptorafts

# Add domain to Firebase
# Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
# Add: cryptorafts.com and www.cryptorafts.com
```

**Visit: https://www.cryptorafts.com**
**Should be LIVE! ✅**

---

## 🚀 QUICKEST DEPLOYMENT

**If you have SSH credentials ready:**

```powershell
# Run automated deployment
.\DEPLOY_TO_HOSTINGER.ps1
```

**Or manually:**

```powershell
# 1. Upload files
scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/

# 2. Deploy
ssh root@YOUR_VPS_IP "cd /var/www/cryptorafts && chmod +x DEPLOY_FASTEST.sh && sudo bash DEPLOY_FASTEST.sh"
```

**That's it! 10 minutes and done! 🚀**

---

**Run `DEPLOY_TO_HOSTINGER.ps1` or follow manual steps above!**

