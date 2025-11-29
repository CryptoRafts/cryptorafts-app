# 🚀 DEPLOY CRYPTORAFTS.COM - Complete Live Deployment

## Make Your CryptoRafts App Live at cryptorafts.com

This guide will help you deploy your complete app to cryptorafts.com through Hostinger.

---

## 📋 COMPLETE DEPLOYMENT CHECKLIST

### ✅ PREPARATION (Already Done)
- [x] All deployment files ready
- [x] VPS configuration prepared
- [x] Deployment scripts created
- [x] Guides created

### ⏳ DEPLOYMENT (Do These Steps)

- [ ] Access Hostinger panel
- [ ] Upload files to cryptorafts.com
- [ ] Configure application
- [ ] Setup SSL certificate
- [ ] Add domain to Firebase
- [ ] Verify deployment
- [ ] **LIVE!** 🎉

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### **STEP 1: ACCESS HOSTINGER PANEL**

1. **Go to:** https://hpanel.hostinger.com/
2. **Login** to your Hostinger account
3. **Navigate to:** Your VPS or Hosting for cryptorafts.com

---

### **STEP 2: ACCESS FILE MANAGER**

1. **In Hostinger panel:**
   - Click **"File Manager"** (left sidebar)
   - Or look for **"Files"** or **"File Browser"**

2. **Navigate to your domain root:**
   - `/public_html` (for shared hosting)
   - `/var/www/html` (for VPS)
   - Or create `/var/www/cryptorafts` for VPS

---

### **STEP 3: UPLOAD APPLICATION FILES**

**In File Manager:**

1. **Navigate to:** Domain root or `/var/www/cryptorafts`
2. **Click:** "Upload" button
3. **Upload files from:** `C:\Users\dell\cryptorafts-starter`
4. **Select:** All files (Ctrl+A)
5. **Exclude:** `node_modules` folder
6. **Click:** "Upload"
7. **Wait** for upload to complete

**Important files to upload:**
- ✅ All `.js`, `.ts`, `.tsx` files
- ✅ `package.json`
- ✅ `next.config.vps.js`
- ✅ `server.js`
- ✅ `ecosystem.config.js`
- ✅ `.env` files (create `.env.production` on server)
- ✅ All other project files

---

### **STEP 4: CONFIGURE APPLICATION**

#### **Option A: Using Hostinger Terminal (if available)**

**In Hostinger panel:**
1. **Click:** "Terminal" or "Console" or "SSH Terminal"
2. **Run commands:**
   ```bash
   cd /var/www/cryptorafts
   # Or: cd /public_html
   
   # Install Node.js (if not installed)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install dependencies
   npm install --production
   
   # Switch to VPS config
   cp next.config.vps.js next.config.js
   
   # Create .env.production
   nano .env.production
   # Paste your Firebase keys (see below)
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   ```

#### **Option B: Using File Manager**

**Create `.env.production` file:**

1. **In File Manager:**
   - Navigate to application directory
   - Click **"New File"** → Name: `.env.production`
   - **Paste this** (replace with your actual keys):

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

2. **Save the file**

3. **Copy config:**
   - Copy `next.config.vps.js`
   - Rename to `next.config.js`

---

### **STEP 5: SETUP SSL CERTIFICATE**

1. **In Hostinger panel:**
   - Go to **"SSL"** or **"Security"**
   - Click **"Install SSL"** or **"Free SSL"**
   - Select domain: **cryptorafts.com** and **www.cryptorafts.com**
   - Click **"Install"**
   - **Wait 5-10 minutes** for SSL activation

2. **Verify SSL:**
   - Check SSL status shows **"Active"** or **"Valid"**
   - Visit: https://www.cryptorafts.com
   - Look for 🔒 padlock in browser

---

### **STEP 6: CONFIGURE NGINX (if needed)**

**If using VPS and Nginx is installed:**

**In File Manager:**
1. Navigate to: `/etc/nginx/sites-available/`
2. Create file: `cryptorafts`
3. Paste Nginx configuration (see `nginx.conf.example`)
4. Enable site through panel or terminal

---

### **STEP 7: ADD DOMAIN TO FIREBASE**

1. **Go to:** https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
2. **Scroll to:** "Authorized domains"
3. **Click:** "Add domain"
4. **Add:** `cryptorafts.com`
5. **Add again:** `www.cryptorafts.com`
6. **Save**

**This is required for authentication to work!**

---

### **STEP 8: VERIFY DEPLOYMENT**

**After all steps:**

1. **Visit:** https://www.cryptorafts.com
2. **Check:**
   - ✅ Website loads correctly
   - ✅ HTTPS active (🔒 padlock)
   - ✅ Homepage displays
   - ✅ Login works
   - ✅ All pages accessible
   - ✅ No console errors (F12 → Console)

**If everything works, you're LIVE! 🎉**

---

## 🔧 TROUBLESHOOTING

### **Website not loading?**
- Check File Manager: files uploaded correctly?
- Check application is running: `pm2 status`
- Check domain DNS: points to correct server IP
- Clear browser cache: Ctrl + Shift + R

### **SSL not working?**
- Wait longer (can take up to 1 hour)
- Check SSL status in Hostinger panel
- Verify domain DNS is correct
- Try: `sudo certbot renew`

### **Application not starting?**
- Check `.env.production` exists and has correct keys
- Check `next.config.js` is correct (copied from `next.config.vps.js`)
- Check PM2 logs: `pm2 logs cryptorafts`
- Check Node.js is installed: `node --version`

### **Authentication not working?**
- Verify domain added to Firebase Authorized Domains
- Wait 5 minutes after adding domain
- Clear browser cache
- Check Firebase console for errors

---

## 📊 DEPLOYMENT STATUS CHECKLIST

Before going live, verify:

- [ ] All files uploaded to server
- [ ] `.env.production` created with Firebase keys
- [ ] `next.config.js` is VPS config
- [ ] Dependencies installed (`npm install --production`)
- [ ] Application built (`npm run build`)
- [ ] Application running (`pm2 status` shows running)
- [ ] SSL certificate installed and active
- [ ] Domain added to Firebase Authorized Domains
- [ ] Website accessible at https://www.cryptorafts.com
- [ ] HTTPS working (🔒 padlock visible)
- [ ] Login/authentication works
- [ ] All pages accessible
- [ ] No console errors

---

## 🎊 DEPLOYMENT COMPLETE!

**Once all checkboxes are done:**

✅ **Your CryptoRafts is LIVE at:** https://www.cryptorafts.com

**Features:**
- ✅ Full Next.js application with SSR
- ✅ All API routes working
- ✅ Firebase authentication
- ✅ Real-time features
- ✅ SSL/HTTPS enabled
- ✅ Production-ready
- ✅ Auto-restart on crash (PM2)

---

## 🚀 QUICK COMMAND REFERENCE

**If you have terminal access:**

```bash
# Check status
pm2 status

# View logs
pm2 logs cryptorafts

# Restart app
pm2 restart cryptorafts

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check if app responds
curl http://localhost:3000
```

---

## 📞 NEED HELP?

**If stuck:**
1. Check Hostinger support chat (in panel)
2. Check PM2 logs: `pm2 logs cryptorafts --lines 100`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Review troubleshooting section above
5. Ask me what step you're on and what error you see

---

## 🎯 YOUR APP WILL BE LIVE AT:

**🌐 https://www.cryptorafts.com**

**🌐 https://cryptorafts.com** (redirects to www)

---

**Follow these steps in your Hostinger panel and your app will be LIVE! 🚀**

