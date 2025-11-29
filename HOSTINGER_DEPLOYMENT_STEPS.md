# 🚀 HOSTINGER DEPLOYMENT - COMPLETE STEP-BY-STEP GUIDE

## Current Status
✅ Project configured for Hostinger static hosting
✅ Build script ready
⏳ **YOU NEED TO:** Complete login to Hostinger and upload files

---

## 📋 COMPLETE DEPLOYMENT CHECKLIST

### STEP 1: BUILD YOUR APP ✅ (Do This First!)

**Option A: Use the automated script**
```powershell
powershell -ExecutionPolicy Bypass -File deploy-to-hostinger.ps1
```

**Option B: Build manually**
```powershell
# 1. Switch to Hostinger config
Copy-Item next.config.hostinger.js next.config.js -Force

# 2. Build the app
npm run build

# 3. Check that 'out' folder was created
Test-Path out
```

**What you need:**
- A folder called `out` containing all your website files
- The `.htaccess` file inside the `out` folder

---

### STEP 2: LOGIN TO HOSTINGER 🚪

1. **Go to:** https://hpanel.hostinger.com
2. **Login** with your Hostinger account credentials
   - If you see Google login, use your Google account
   - Or use email/password login

3. **Once logged in, you should see:**
   - Your hPanel dashboard
   - List of your websites/domains

---

### STEP 3: UPLOAD FILES TO HOSTINGER 📤

#### A. Open File Manager
1. In hPanel, find **"File Manager"** (usually in the left sidebar or main dashboard)
2. Click **"File Manager"**
3. Navigate to your domain's folder (usually `public_html` or your domain name folder)

#### B. Clear Existing Files (IMPORTANT!)
1. **Select ALL files** in the `public_html` folder
2. **Delete** them (this clears old files)
3. **Confirm** deletion

#### C. Upload Your Build Files
1. Click **"Upload"** or **"Upload Files"** button
2. Navigate to your project folder: `C:\Users\dell\cryptorafts-starter\out`
3. **Select ALL files** from the `out` folder including:
   - All HTML files
   - All CSS files
   - All JavaScript files
   - All image assets
   - **IMPORTANT:** `.htaccess` file (make sure to show hidden files!)
4. Click **"Upload"**
5. Wait for upload to complete (usually 2-5 minutes)

**OR Use FTP (Alternative Method):**
1. Get FTP credentials from hPanel → **"FTP Accounts"**
2. Use FileZilla or any FTP client
3. Connect to your server
4. Upload all files from `out` folder to `public_html`

---

### STEP 4: CONFIGURE SSL CERTIFICATE 🔒

1. In hPanel, go to **"SSL"** or **"Security"**
2. Find **"Free SSL"** or **"Let's Encrypt SSL"**
3. Click **"Install SSL"** or **"Activate SSL"**
4. Select your domain
5. Click **"Install"**
6. **Wait 10-15 minutes** for SSL to activate

**Check SSL Status:**
- After 15 minutes, SSL should show as **"Active"** or **"Valid"**
- If not active, wait a bit longer (can take up to 1 hour)

---

### STEP 5: ADD DOMAIN TO FIREBASE 🔥

**CRITICAL:** Your app uses Firebase for authentication. You MUST add your domain!

1. **Go to:** https://console.firebase.google.com
2. **Select project:** `cryptorafts-b9067`
3. **Click:** "Authentication" (left sidebar)
4. **Click:** "Settings" tab
5. **Scroll to:** "Authorized domains" section
6. **Click:** "Add domain"
7. **Add these domains one by one:**
   - `yourdomain.com` (replace with your actual domain)
   - `www.yourdomain.com`
   - `localhost` (should already be there)

**Example if your domain is cryptorafts.com:**
- Add: `cryptorafts.com`
- Add: `www.cryptorafts.com`

---

### STEP 6: TEST YOUR WEBSITE! 🎉

1. **Wait 5-10 minutes** after uploading files
2. **Visit:** `https://yourdomain.com`
3. **Check:**
   - ✅ Website loads
   - ✅ HTTPS is active (🔒 padlock in browser)
   - ✅ Homepage displays correctly
   - ✅ Login works
   - ✅ No console errors (press F12 to check)

---

## 🚨 TROUBLESHOOTING

### Issue: "404 Not Found"
**Solution:**
- Make sure you uploaded files to `public_html` folder
- Check that `index.html` exists in `public_html`
- Verify `.htaccess` file was uploaded

### Issue: "SSL Not Working"
**Solution:**
- Wait longer (can take up to 1 hour)
- In hPanel, try refreshing SSL certificate
- Make sure domain is properly connected

### Issue: "Firebase Authentication Error"
**Solution:**
- Make sure domain is added to Firebase Authorized Domains
- Wait 5 minutes after adding domain
- Clear browser cache and try again

### Issue: "Website Shows Old Version"
**Solution:**
- Clear browser cache (Ctrl + Shift + Delete)
- Hard refresh (Ctrl + F5)
- Wait 5-10 minutes for changes to propagate

### Issue: "Files Won't Upload"
**Solution:**
- Check file size limits in hPanel
- Try uploading smaller batches
- Use FTP client (FileZilla) instead

---

## 📞 NEED HELP?

### Hostinger Support:
- **24/7 Chat:** Available in hPanel (bottom right corner)
- **Email:** support@hostinger.com
- **Knowledge Base:** https://support.hostinger.com

### Common Questions:
- **"Which folder should I upload to?"** → `public_html`
- **"How long does SSL take?"** → Usually 10-15 minutes, up to 1 hour
- **"Can I upload via FTP?"** → Yes! Get credentials from hPanel → FTP Accounts
- **"Will my Firebase features work?"** → Yes, after adding domain to Firebase

---

## ✅ FINAL CHECKLIST

Before you're done, verify:

- [ ] Build completed successfully (`out` folder exists)
- [ ] All files uploaded to `public_html` on Hostinger
- [ ] `.htaccess` file uploaded
- [ ] SSL certificate installed and active
- [ ] Domain added to Firebase Authorized Domains
- [ ] Website loads at `https://yourdomain.com`
- [ ] HTTPS is working (🔒 padlock visible)
- [ ] Login/authentication works
- [ ] No console errors (F12 → Console)
- [ ] All pages accessible

---

## 🎊 CONGRATULATIONS!

Once all checkboxes are done, your CryptoRafts platform is LIVE! 🚀

**Share your website:**
```
🌐 https://yourdomain.com
✅ Fully-featured Web3 platform
✅ Firebase authentication
✅ All roles working
```

---

**Need help? Let me know where you're stuck!** 😊

