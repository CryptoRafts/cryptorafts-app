# ⚡ QUICK GUIDE - Deploy via Hostinger Panel

## 🎯 5 Steps to Deploy Through Hostinger Panel

---

### **STEP 1: Upload Files** (5 minutes)

1. Go to: https://hpanel.hostinger.com/vps/1097850/overview
2. Click **"File Manager"** (left sidebar)
3. Navigate to: `/var/www/cryptorafts` (create folder if needed)
4. Click **"Upload"**
5. Upload ALL files from `C:\Users\dell\cryptorafts-starter`
6. **Skip:** `node_modules` folder

---

### **STEP 2: Use Terminal or Node.js Manager** (5 minutes)

**Option A: If Terminal is available**
1. Click **"Terminal"** or **"Console"** in panel
2. Run:
   ```bash
   cd /var/www/cryptorafts
   npm install --production
   cp next.config.vps.js next.config.js
   npm run build
   pm2 start ecosystem.config.js
   ```

**Option B: If Node.js Manager is available**
1. Click **"Node.js"** or **"Applications"** in panel
2. Create application:
   - Root: `/var/www/cryptorafts`
   - Startup: `server.js`
   - Port: `3000`
3. Start application

---

### **STEP 3: Create Environment File** (2 minutes)

1. In **File Manager:**
2. Navigate to `/var/www/cryptorafts`
3. Click **"New File"** → Name: `.env.production`
4. Paste your Firebase keys (see DEPLOY_VIA_HOSTINGER_PANEL.md)
5. Save

---

### **STEP 4: Setup SSL** (2 minutes)

1. In VPS panel, click **"SSL"** or **"Security"**
2. Install SSL for:
   - `cryptorafts.com`
   - `www.cryptorafts.com`
3. Wait 5-10 minutes

---

### **STEP 5: Add to Firebase** (1 minute)

1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
2. Add domains: `cryptorafts.com` and `www.cryptorafts.com`

---

## ✅ DONE! 

**Visit:** https://www.cryptorafts.com

**Your app is live! 🚀**

---

**Need help? Read:** `DEPLOY_VIA_HOSTINGER_PANEL.md` for detailed steps.


