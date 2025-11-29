# 📤 FILES TO UPLOAD - COMPLETE CHECKLIST

## Upload Location: `/home/u386122906/cryptorafts/`

Upload these files from: `C:\Users\dell\cryptorafts-starter`

---

## ✅ CRITICAL FILES (MUST UPLOAD):

### 1. **`src/`** folder (ENTIRE FOLDER - MOST IMPORTANT!)
   - ✅ This contains your app code
   - ✅ Must include `src/app/page.tsx`
   - ✅ Right-click `src/` folder → Upload (entire folder!)

### 2. **`package.json`**
   - ✅ Project dependencies and scripts

### 3. **`next.config.js`**
   - ✅ Next.js configuration

### 4. **`AUTOMATE_EVERYTHING_FINAL.sh`**
   - ✅ Deployment script (upload this!)

---

## ✅ IMPORTANT FILES (SHOULD UPLOAD):

### 5. **`server.js`** (if exists)
   - ✅ Custom Node.js server

### 6. **`ecosystem.config.js`** (if exists)
   - ✅ PM2 configuration

### 7. **`RUN_AFTER_UPLOAD.sh`** (if exists)
   - ✅ Alternative deployment script

### 8. **`DO_EVERYTHING_NOW.sh`** (if exists)
   - ✅ Alternative deployment script

### 9. **`INSTALL_AND_DEPLOY_NO_SUDO.sh`** (if exists)
   - ✅ Alternative deployment script

---

## ✅ CONFIGURATION FILES (SHOULD UPLOAD):

### 10. **`.env.local`** or **`.env.production`** (if exists)
   - ✅ Environment variables
   - ⚠️  Make sure sensitive keys are secure!

### 11. **`next.config.vps.js`** (if exists)
   - ✅ VPS-specific Next.js config

### 12. **`tsconfig.json`** (if exists)
   - ✅ TypeScript configuration

### 13. **`.gitignore`** (if exists)
   - ✅ Git ignore rules

---

## ✅ OTHER FOLDERS (UPLOAD IF EXISTS):

### 14. **`public/`** folder (if exists)
   - ✅ Static assets

### 15. **`components/`** folder (if exists)
   - ✅ React components (if not in src/)

### 16. **`lib/`** folder (if exists)
   - ✅ Library files (if not in src/)

### 17. **`types/`** folder (if exists)
   - ✅ TypeScript type definitions

---

## ❌ DO NOT UPLOAD:

- ❌ `node_modules/` folder (will be installed on VPS)
- ❌ `.next/` folder (will be built on VPS)
- ❌ `.git/` folder (not needed for deployment)
- ❌ `out/` folder (will be built on VPS)
- ❌ Build files (`.next/`, `out/`, `dist/`)
- ❌ Cache files
- ❌ Log files

---

## 📋 QUICK UPLOAD STEPS:

1. **In Hostinger File Manager**, you should be in: `/home/u386122906/cryptorafts/`

2. **Click "Upload"** button (top of File Manager)

3. **Click "Select Files"** or drag and drop

4. **Navigate to:** `C:\Users\dell\cryptorafts-starter`

5. **Select these files/folders:**
   - ✅ `src/` (ENTIRE folder - most important!)
   - ✅ `package.json`
   - ✅ `next.config.js`
   - ✅ `AUTOMATE_EVERYTHING_FINAL.sh`
   - ✅ `server.js` (if exists)
   - ✅ `ecosystem.config.js` (if exists)
   - ✅ `.env.local` or `.env.production` (if exists)
   - ✅ `tsconfig.json` (if exists)
   - ✅ `public/` folder (if exists)
   - ✅ All other files EXCEPT:
     - ❌ `node_modules/`
     - ❌ `.next/`
     - ❌ `.git/`
     - ❌ `out/`

6. **Click "Upload"** or wait for automatic upload

7. **Wait for upload to complete** (5-10 minutes)

---

## ✅ VERIFY AFTER UPLOAD:

**In File Manager, check:**
- ✅ `/home/u386122906/cryptorafts/src/app/page.tsx` exists
- ✅ `/home/u386122906/cryptorafts/package.json` exists
- ✅ `/home/u386122906/cryptorafts/next.config.js` exists
- ✅ `/home/u386122906/cryptorafts/AUTOMATE_EVERYTHING_FINAL.sh` exists

**If all exist:** ✅ Files uploaded correctly!  
**If any missing:** Upload missing files again!

---

## 📋 UPLOAD SUMMARY:

**CRITICAL (Must upload):**
1. ✅ `src/` folder (entire folder!)
2. ✅ `package.json`
3. ✅ `next.config.js`
4. ✅ `AUTOMATE_EVERYTHING_FINAL.sh`

**IMPORTANT (Should upload):**
5. ✅ `server.js` (if exists)
6. ✅ `ecosystem.config.js` (if exists)
7. ✅ `.env.local` or `.env.production` (if exists)
8. ✅ Other configuration files

**DO NOT UPLOAD:**
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `.git/`
- ❌ `out/`

---

## Done! ✅

After upload, verify files exist, then run deployment script in SSH terminal:
```bash
bash AUTOMATE_EVERYTHING_FINAL.sh
```

