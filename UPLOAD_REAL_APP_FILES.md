# 📤 UPLOAD REAL APPLICATION FILES

## ⚠️ CRITICAL: You're Only Running a Placeholder!

**Current Status:**
- ❌ Server has ONLY 2 placeholder files (page.tsx, layout.tsx)
- ✅ Your local project has 740+ files with the FULL application
- ❌ The real application files were NEVER uploaded

---

## 📋 WHAT YOU NEED TO UPLOAD

From: `C:\Users\dell\cryptorafts-starter`  
To: `/var/www/cryptorafts` (via Hostinger File Manager)

### ✅ REQUIRED FILES/FOLDERS:

1. **`src/` folder** (ENTIRE folder - 740+ files)
   - Contains ALL your application code
   - Components, pages, libraries, etc.
   - This is the MOST IMPORTANT

2. **`package.json`** (your full version with all dependencies)
   - Current server version is minimal (only 3 dependencies)
   - Your local version has 50+ dependencies
   - MUST upload your REAL package.json

3. **`next.config.js`** (your actual config)
   - May have custom configurations

4. **`tsconfig.json`** (TypeScript config)

5. **`public/` folder** (if exists)
   - Contains favicon.ico, images, static files
   - Fixes the favicon 404 error

6. **Any other config files:**
   - `.env.local` or `.env.production` (if needed)
   - `tailwind.config.js`
   - `postcss.config.js`
   - Other config files

---

## 📤 STEP-BY-STEP UPLOAD INSTRUCTIONS

### Step 1: Open Hostinger File Manager

1. Go to: https://hpanel.hostinger.com/
2. Click **"File Manager"**
3. Navigate to: `/var/www/cryptorafts`
4. Verify you're in the correct directory

---

### Step 2: DELETE Placeholder Files First

**Important:** Delete the placeholder files we created:

1. In File Manager, navigate to `/var/www/cryptorafts/src/app`
2. **DELETE:**
   - `page.tsx` (the placeholder one)
   - `layout.tsx` (the placeholder one)
3. This ensures your real files aren't overwritten

**OR** delete the entire `src` folder and re-upload it fresh.

---

### Step 3: Upload REAL Files

**Upload from `C:\Users\dell\cryptorafts-starter`:**

1. **Upload `src/` folder** (ENTIRE folder)
   - Select the entire `src` folder
   - Upload it (this will replace/merge with existing)
   - This is ~740 files - may take a few minutes

2. **Upload `package.json`**
   - Your full version with all dependencies
   - This replaces the minimal one on server

3. **Upload `next.config.js`** (if different from server)

4. **Upload `tsconfig.json`** (if different)

5. **Upload `public/` folder** (if exists)
   - Contains favicon, images, static assets
   - Fixes favicon 404 errors

---

### Step 4: Fix Ownership

After uploading, run in SSH:

```bash
cd /var/www/cryptorafts
chown -R root:root /var/www/cryptorafts
chmod -R 755 /var/www/cryptorafts
find /var/www/cryptorafts -type f -exec chmod 644 {} \;
```

---

### Step 5: Reinstall Dependencies

The `package.json` changed, so reinstall:

```bash
cd /var/www/cryptorafts
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 20
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

This will install ALL your dependencies (50+ packages).

---

### Step 6: Rebuild and Deploy

```bash
rm -rf .next out
NODE_ENV=production npm run build
pm2 stop cryptorafts
pm2 delete cryptorafts
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

---

## ⚡ QUICK COMMAND (After Uploading Files)

Run this complete command after uploading:

```bash
cd /var/www/cryptorafts && chown -R root:root /var/www/cryptorafts && chmod -R 755 /var/www/cryptorafts && find /var/www/cryptorafts -type f -exec chmod 644 {} \; && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20 && rm -rf node_modules package-lock.json && echo "📦 Installing dependencies (this will take 10-15 minutes)..." && npm install --legacy-peer-deps && echo "✅ Dependencies installed!" && echo "🔨 Building app..." && rm -rf .next out && NODE_ENV=production npm run build && echo "✅ Build completed!" && pm2 stop cryptorafts && pm2 delete cryptorafts && pm2 start ecosystem.config.js && pm2 save && pm2 status && sleep 10 && pm2 logs cryptorafts --lines 20 --nostream && echo "" && echo "✅ DEPLOYMENT COMPLETE! Visit: https://www.cryptorafts.com"
```

---

## 📊 File Count Verification

**Your Local Project:**
- `src/` folder: **740+ files**
- Full `package.json` with 50+ dependencies
- Complete application structure

**Current Server:**
- `src/` folder: **2 files** (placeholder only)
- Minimal `package.json` (3 dependencies)
- Just a placeholder page

---

## ❌ DO NOT Upload

- ❌ `node_modules/` (will be installed via npm)
- ❌ `.next/` (will be built)
- ❌ `.git/` (version control)
- ❌ `out/` (build output)

---

## ✅ After Upload

1. Verify files in File Manager:
   - `src/` should have hundreds of files
   - `package.json` should have many dependencies
   - `public/` folder should exist

2. Run the quick command above

3. Your REAL app will be live!

