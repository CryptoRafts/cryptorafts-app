# 📋 EXACT STEPS TO UPLOAD FILES

## ⚠️ CRITICAL: Files Are NOT in `/var/www/cryptorafts`

Your files are **NOT** being uploaded to the correct location, or the upload is failing.

---

## 📁 Step 1: Verify File Manager Location

1. Go to: https://hpanel.hostinger.com/
2. Click **"File Manager"**
3. Look at the breadcrumb at the top
4. **It MUST show**: `Home > var > www > cryptorafts`
5. If it shows something else (like `public_html` or `domains`), navigate to `/var/www/cryptorafts`

---

## 📦 Step 2: Check What's Currently There

In File Manager, you should see:
- `cryptorafts.tar.gz` (old file - you can delete this)
- `ecosystem.config.js`
- `server.js`
- `logs/` folder

You should **NOT** see:
- `src/` folder
- `package.json`
- `next.config.js`
- `tsconfig.json`

**If you don't see `src/` and `package.json`, the upload didn't work!**

---

## 📤 Step 3: Upload Files CORRECTLY

### In Hostinger File Manager:

1. Make sure you're in `/var/www/cryptorafts` (check breadcrumb)
2. Click **"Upload"** button
3. Select files from `C:\Users\dell\cryptorafts-starter`
4. **Select ONLY these:**
   - ✅ **`src/`** folder (select the ENTIRE folder, not files inside)
   - ✅ **`package.json`** (single file)
   - ✅ **`next.config.js`** (single file)
   - ✅ **`tsconfig.json`** (single file)
   - ✅ **`public/`** folder (if it exists)

5. **DO NOT select:**
   - ❌ `node_modules/`
   - ❌ `.next/`
   - ❌ `.git/`
   - ❌ `out/`
   - ❌ Any other large folders

6. Click **"Upload"**

7. **Wait for upload to complete** (should be fast - ~5-10 MB)

---

## ✅ Step 4: Verify Upload in File Manager

After upload completes, in File Manager you should see:
- ✅ `src/` folder (with `app` folder inside)
- ✅ `package.json` file
- ✅ `next.config.js` file
- ✅ `tsconfig.json` file

If you don't see these, the upload failed - try again!

---

## 🔍 Step 5: Verify in SSH

After verifying in File Manager, run in SSH:

```bash
cd /var/www/cryptorafts
ls -la
```

You should see:
- `src/` directory
- `package.json` file
- `next.config.js` file
- `tsconfig.json` file

If you don't see these, try:
```bash
chown -R root:root /var/www/cryptorafts
ls -la
```

---

## 🚀 Step 6: Run Deployment

After files are visible in SSH, run:

1. Open `SIMPLE_SEARCH_AND_DEPLOY.txt`
2. Copy the ENTIRE command
3. Paste into SSH terminal
4. Press Enter

---

## ❌ Common Problems:

### Problem 1: Upload to Wrong Directory
- **Symptom**: Files visible in File Manager but not in SSH
- **Fix**: Make sure you're uploading to `/var/www/cryptorafts`, not `/home` or `/domains`

### Problem 2: Upload Stalled/Failed
- **Symptom**: Upload shows 0% or stalls
- **Fix**: Cancel upload, check file sizes, try uploading one file at a time

### Problem 3: Files Visible in File Manager but NOT in SSH
- **Symptom**: Files show in web interface but `ls -la` shows nothing
- **Fix**: Run `chown -R root:root /var/www/cryptorafts` then `ls -la` again

### Problem 4: Wrong Files Selected
- **Symptom**: Upload takes hours, uploads 100k+ files
- **Fix**: Cancel upload, select ONLY the 4-5 files listed above

---

## 📞 Still Not Working?

If files still don't appear after following all steps:

1. Take a screenshot of File Manager showing `/var/www/cryptorafts`
2. Take a screenshot of the upload dialog showing selected files
3. Run `ls -la /var/www/cryptorafts` in SSH and share output

The files MUST be visible in both File Manager AND SSH before deployment will work!

