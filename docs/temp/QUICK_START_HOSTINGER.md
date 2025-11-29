# ⚡ QUICK START - Deploy to Hostinger in 10 Minutes

## 🎯 Super Fast Deployment Guide

---

## ✅ **STEP 1: PREPARE FILES (5 minutes)**

### Open PowerShell in your project folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File deploy-to-hostinger.ps1
```

**What this does:**
- ✅ Installs dependencies
- ✅ Builds your project
- ✅ Creates 'out' folder with all files
- ✅ Generates .htaccess file
- ✅ Optimizes for production

**Result:** You'll have an `out` folder ready to upload! 📁

---

## 🌐 **STEP 2: UPLOAD TO HOSTINGER (3 minutes)**

### Option A: File Manager (Easy!)

1. **Login**: https://hpanel.hostinger.com
2. Click: **"File Manager"**
3. Open: **"public_html"** folder
4. **Delete** all existing files
5. Click: **"Upload Files"**
6. **Select ALL files** from your `out` folder
7. **Wait** for upload to complete (2-5 minutes)
8. ✅ Done!

### Option B: FTP (Faster for large files)

1. Download: [FileZilla](https://filezilla-project.org/)
2. In hPanel: **"FTP Accounts"** → Get credentials
3. Connect FileZilla with your credentials
4. Navigate to: **public_html**
5. Drag & drop all files from **out** folder
6. ✅ Done!

---

## 🔒 **STEP 3: SETUP SSL (2 minutes)**

1. In hPanel → **"SSL"**
2. Click: **"Install SSL"**
3. Select: **"Free SSL"** (Let's Encrypt)
4. Click: **"Install"**
5. Wait: 10-15 minutes for activation
6. ✅ Done!

---

## 🔥 **STEP 4: CONFIGURE FIREBASE (1 minute)**

1. Go to: https://console.firebase.google.com
2. Select: **"cryptorafts-b9067"**
3. Click: **Authentication** → **Settings** → **Authorized domains**
4. Click: **"Add domain"**
5. Add: **yourdomain.com**
6. Add: **www.yourdomain.com**
7. ✅ Done!

---

## 🎉 **STEP 5: LAUNCH!**

Visit: **https://yourdomain.com**

🎊 **YOUR CRYPTORAFTS IS LIVE!** 🎊

---

## 🆘 TROUBLESHOOTING (If something doesn't work)

### Problem: Website shows old content
**Fix:** Clear browser cache (Ctrl + Shift + Delete)

### Problem: Routes give 404 errors
**Fix:** Make sure `.htaccess` file is uploaded (it's hidden!)

### Problem: Firebase not connecting
**Fix:** Check domain is added to Firebase authorized domains

### Problem: Images not loading
**Fix:** Check all files uploaded, including `_next` folder

---

## 📞 **NEED HELP?**

**Hostinger 24/7 Support:**
- Chat: In hPanel (bottom right corner)
- Email: support@hostinger.com

**Read Full Guide:**
- See: `HOSTINGER_NEXTJS_DEPLOYMENT.md`

---

## 🔄 **FUTURE UPDATES**

To update your site after making changes:

```powershell
# 1. Build again
powershell -ExecutionPolicy Bypass -File deploy-to-hostinger.ps1

# 2. Upload new files from 'out' folder to Hostinger
# 3. Done!
```

---

## 💡 **IMPORTANT FILES TO UPLOAD**

Make sure these are uploaded:
- ✅ `index.html`
- ✅ `.htaccess` (hidden file!)
- ✅ `_next/` folder (contains all CSS/JS)
- ✅ Any images or assets
- ✅ All HTML files for your routes

---

## 🎯 **YOUR CHECKLIST**

- [ ] Run deployment script
- [ ] Login to Hostinger hPanel
- [ ] Upload files to public_html
- [ ] Install SSL certificate
- [ ] Add domain to Firebase
- [ ] Test website on live domain
- [ ] Celebrate! 🎉

---

**⏱️ Total Time: ~10 minutes**

**🚀 Let's get your CryptoRafts online!**

