# 📋 UPLOAD FILES CHECKLIST

## ⚠️ CRITICAL: Files Must Be Uploaded Via Hostinger File Manager

Files are **NOT** in `/var/www/cryptorafts` - you MUST upload them!

---

## 📁 Step 1: Open Hostinger File Manager

1. Go to: https://hpanel.hostinger.com/
2. Click **"File Manager"**
3. Navigate to: **`/var/www/cryptorafts`**
4. Make sure you're in the correct directory!

---

## 📦 Step 2: Upload These Files

From your local computer: **`C:\Users\dell\cryptorafts-starter`**

Upload to: **`/var/www/cryptorafts`**

### ✅ Required Files:

1. **`src/`** folder
   - This is a **FOLDER**, not individual files
   - Upload the **ENTIRE** `src/` folder
   - Contains: `src/app/page.tsx`, `src/app/layout.tsx`, etc.

2. **`package.json`**
   - This file is **REQUIRED**
   - Located in root: `cryptorafts-starter/package.json`

3. **`next.config.js`**
   - Configuration file for Next.js
   - Located in root: `cryptorafts-starter/next.config.js`

4. **`tsconfig.json`**
   - TypeScript configuration
   - Located in root: `cryptorafts-starter/tsconfig.json`

### 📁 Optional (if exists):

5. **`public/`** folder (if it exists)
   - Upload entire folder if present

---

## ✅ Step 3: Verify Upload

After uploading, run this in SSH terminal:

```bash
cd /var/www/cryptorafts
ls -la package.json src/app/page.tsx next.config.js
```

You should see:
```
-rw-r--r-- 1 root root 1234 Nov  3 00:00 package.json
-rw-r--r-- 1 root root 1234 Nov  3 00:00 src/app/page.tsx
-rw-r--r-- 1 root root 1234 Nov  3 00:00 next.config.js
```

---

## 🚀 Step 4: Run Deployment

After files are uploaded, run the command from `COMPLETE_FIX_NOW.txt`

Or run:

```bash
cd /var/www/cryptorafts
bash FIND_FILES_AND_DEPLOY.sh
```

---

## ❌ Common Mistakes:

1. **Uploading files to wrong directory**
   - Must be: `/var/www/cryptorafts`
   - NOT: `/var/www/cryptorafts/DEPLOY_TO_VPS`

2. **Not uploading `src/` folder**
   - Must upload the **ENTIRE** folder
   - Not individual files inside

3. **Missing `package.json`**
   - This file is **CRITICAL**
   - Without it, deployment will fail

4. **Wrong file permissions**
   - After upload, files should be readable
   - If not, the deployment script will fix permissions

---

## 🔍 If Files Still Not Found:

Run this in SSH to search for files:

```bash
find /var/www /home -name "package.json" -type f 2>/dev/null | grep -i cryptorafts
```

This will show where files actually are (if they exist).

---

## 📞 Need Help?

If files are still not found after uploading:
1. Check File Manager shows files in `/var/www/cryptorafts`
2. Take a screenshot of File Manager
3. Run `ls -la /var/www/cryptorafts` in SSH
4. Compare the two - they should match!

