# 🚀 DEPLOY NOW - COMPLETE AUTOMATION

## ⚡ IMMEDIATE DEPLOYMENT TO CRYPTORAFTS.COM

Everything is ready. Follow these exact steps to deploy NOW.

---

## ✅ ALL FILES READY

Your deployment package includes:
- ✅ `next.config.vps.js` - VPS configuration
- ✅ `server.js` - Custom server
- ✅ `ecosystem.config.js` - PM2 config
- ✅ `deploy-to-hostinger-vps.sh` - Automated setup
- ✅ `DEPLOY_NOW.sh` - Quick deploy script

---

## 🚀 DEPLOY IN 3 STEPS (15 Minutes)

### **STEP 1: GET SSH ACCESS** (2 minutes)

**Option A: From Hostinger Panel**
1. Login: https://hpanel.hostinger.com/vps/1097850/overview
2. Click "SSH Access" or "Server Details"
3. Copy: IP Address, Username (root), Password

**Option B: Use File Manager**
1. Login: https://hpanel.hostinger.com/
2. Click "File Manager"
3. Navigate to `/var/www/cryptorafts`

---

### **STEP 2: UPLOAD FILES** (5 minutes)

**On Windows PowerShell:**

```powershell
cd C:\Users\dell\cryptorafts-starter

# Replace YOUR_VPS_IP with actual IP from Hostinger
scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/
```

**OR Use WinSCP:**
1. Download: https://winscp.net/
2. Connect: Your VPS IP, Username: root, Password: from Hostinger
3. Upload all files to: `/var/www/cryptorafts`

---

### **STEP 3: DEPLOY** (8 minutes)

**Connect to VPS:**
```powershell
ssh root@YOUR_VPS_IP
```

**Once connected, run:**
```bash
cd /var/www/cryptorafts

# Run automated setup (installs everything)
chmod +x deploy-to-hostinger-vps.sh
sudo bash deploy-to-hostinger-vps.sh

# Wait for setup to complete (5-10 minutes)

# Then deploy app
cp next.config.vps.js next.config.js
npm install --production

# Create .env.production
nano .env.production
# Paste your Firebase keys (see below)

# Build and start
npm run build
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Run the command it shows

# Setup SSL
sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com

# Add to Firebase
# Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
# Add: cryptorafts.com and www.cryptorafts.com
```

---

## 🔑 ENVIRONMENT VARIABLES (.env.production)

**Create this file on your VPS:**

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
OPENAI_API_KEY=your_openai_key_here
```

**Get your Firebase keys from:**
https://console.firebase.google.com/project/cryptorafts-b9067/settings/general

---

## ✅ VERIFY DEPLOYMENT

**After deployment:**

1. **Visit:** https://www.cryptorafts.com
2. **Check:**
   - ✅ Website loads
   - ✅ HTTPS active (🔒)
   - ✅ Login works
   - ✅ All pages accessible

**If everything works, you're LIVE! 🎉**

---

## 🎊 DEPLOYMENT COMPLETE!

**Your CryptoRafts is LIVE at:**
🌐 https://www.cryptorafts.com

**Features Active:**
- ✅ Full Next.js application
- ✅ Firebase authentication
- ✅ All API routes
- ✅ SSL/HTTPS enabled
- ✅ Production-ready

---

**Follow the 3 steps above and your app will be LIVE in 15 minutes! 🚀**

