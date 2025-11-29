# 🚀 DEPLOY VIA HOSTINGER PANEL - Complete Guide

## Deploy Your CryptoRafts App Directly Through Hostinger VPS Panel

This guide shows you how to deploy completely through the Hostinger web interface without using SSH.

---

## 📋 STEP 1: ACCESS FILE MANAGER IN HOSTINGER PANEL

1. **Go to:** https://hpanel.hostinger.com/vps/1097850/overview
2. **Look for:** "File Manager" or "Files" in the left sidebar or main dashboard
3. **Click:** "File Manager"
4. **Navigate to:** `/var/www/html` or `/public_html` or root directory

---

## 📤 STEP 2: UPLOAD YOUR APPLICATION FILES

### Option A: Using Hostinger File Manager Upload

1. **In File Manager:**
   - Navigate to `/var/www/html` or create `/var/www/cryptorafts` directory
   - Click **"Upload"** or **"Upload Files"** button

2. **Upload these files from your local machine:**
   - All project files (select all files from `C:\Users\dell\cryptorafts-starter`)
   - **Exclude:** `node_modules` folder (install on server instead)
   - **Exclude:** `.git` folder (optional)

3. **Upload process:**
   - Drag and drop files or click "Select Files"
   - Select all files from your project folder
   - Wait for upload to complete

### Option B: Create Directory Structure

**In File Manager:**
1. Create directory: `/var/www/cryptorafts`
2. Navigate into it
3. Upload all your files there

---

## ⚙️ STEP 3: CHECK SSH ACCESS IN HOSTINGER PANEL

1. **Go to:** VPS Overview page
2. **Look for:** "SSH Access" or "Server Access" section
3. **Note down:**
   - **IP Address**
   - **Username** (usually `root`)
   - **Password** or **SSH Key**

**If SSH is enabled, you can use it. Otherwise, continue with File Manager method.**

---

## 🔧 STEP 4: USE HOSTINGER TERMINAL (if available)

**Some Hostinger VPS panels have a built-in terminal:**

1. **Look for:** "Terminal" or "Console" or "SSH Terminal" in the panel
2. **Click:** "Open Terminal" or similar
3. **Run commands directly in the web terminal**

**If terminal is available, you can run:**

```bash
cd /var/www/cryptorafts

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install dependencies
npm install --production

# Switch to VPS config
cp next.config.vps.js next.config.js

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## 📁 STEP 5: USE FILE MANAGER TO CREATE CONFIG FILES

**If you can't use terminal, create files manually:**

### Create `.env.production` file:

1. **In File Manager:**
   - Navigate to `/var/www/cryptorafts`
   - Click **"New File"** or **"Create File"**
   - Name: `.env.production`
   - **Paste this content** (replace with your actual keys):

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

### Copy VPS Config:

1. **In File Manager:**
   - Navigate to `/var/www/cryptorafts`
   - **Copy:** `next.config.vps.js`
   - **Rename copy to:** `next.config.js`

---

## 🔧 STEP 6: USE HOSTINGER NODE.JS MANAGER (if available)

**Some Hostinger VPS panels have Node.js management:**

1. **Look for:** "Node.js" or "Applications" in the VPS panel
2. **Click:** "Create Application" or "New Application"
3. **Configure:**
   - **Application name:** `cryptorafts`
   - **Node.js version:** 18.x or 20.x
   - **Application root:** `/var/www/cryptorafts`
   - **Startup file:** `server.js`
   - **Port:** `3000`

4. **Start application** from the panel

---

## 🌐 STEP 7: CONFIGURE NGINX THROUGH HOSTINGER PANEL

**If Hostinger panel has Nginx configuration:**

1. **Look for:** "Nginx" or "Web Server" in VPS panel
2. **Create site configuration:**
   - Domain: `cryptorafts.com` and `www.cryptorafts.com`
   - Document root: `/var/www/cryptorafts`
   - Port: `3000` (proxy to Node.js app)

**OR use File Manager:**

1. Navigate to: `/etc/nginx/sites-available/`
2. Create file: `cryptorafts`
3. Paste Nginx configuration (see `nginx.conf.example`)
4. Enable site through panel or File Manager

---

## 🔒 STEP 8: SETUP SSL THROUGH HOSTINGER PANEL

1. **Look for:** "SSL" or "Security" or "Let's Encrypt" in VPS panel
2. **Click:** "Install SSL" or "Enable SSL"
3. **Select domains:**
   - `cryptorafts.com`
   - `www.cryptorafts.com`
4. **Click:** "Install" or "Activate"
5. **Wait 5-10 minutes** for SSL to activate

---

## 🔥 STEP 9: ADD DOMAIN TO FIREBASE

1. **Go to:** https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
2. **Scroll to:** "Authorized domains"
3. **Click:** "Add domain"
4. **Add:** `cryptorafts.com`
5. **Add again:** `www.cryptorafts.com`

---

## ✅ STEP 10: VERIFY DEPLOYMENT

1. **Visit:** https://www.cryptorafts.com
2. **Check:**
   - ✅ Website loads
   - ✅ HTTPS active (🔒 padlock)
   - ✅ Homepage displays
   - ✅ Login works

---

## 📋 HOSTINGER PANEL FEATURES TO USE

**Common features in Hostinger VPS panel:**

- ✅ **File Manager** - Upload and manage files
- ✅ **Terminal/Console** - Run commands
- ✅ **Node.js Manager** - Manage Node.js applications
- ✅ **SSL Manager** - Install SSL certificates
- ✅ **Domain Manager** - Configure domains
- ✅ **Monitoring** - Check server status
- ✅ **Backup** - Backup your application

**Use whichever features are available in your panel!**

---

## 🚨 TROUBLESHOOTING

### Files won't upload?
- Check file size limits
- Upload in smaller batches
- Use ZIP and extract on server

### Can't find File Manager?
- Check left sidebar menu
- Look for "Files" or "File Browser"
- Contact Hostinger support

### Application not starting?
- Check Node.js is installed
- Verify all files uploaded correctly
- Check `.env.production` file exists
- Verify `next.config.js` is correct

---

## 📞 NEED HELP?

**If stuck:**
1. Use Hostinger support chat (usually in panel)
2. Check Hostinger documentation
3. Try different panel features
4. Ask me which step you're on

---

## 🎊 DEPLOYMENT COMPLETE!

Once everything is done, your CryptoRafts will be live at:

**🌐 https://www.cryptorafts.com**

**All done through the Hostinger panel! 🚀**


