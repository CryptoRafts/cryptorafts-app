# 📂 FILE MANAGER - CHOOSE CORRECT OPTION

## ✅ You're in File Manager!

You see two options - choose the CORRECT one:

---

## ✅ Choose: "Access all files of Premium Web Hosting" (Right Card)

**Why:** This gives you access to `/home/u386122906/` where we need to upload files.

**Steps:**
1. **Click the RIGHT card** - "Access all files of Premium Web Hosting"
2. You'll see all files in your hosting plan

---

## ❌ Do NOT choose: "Access files of cryptorafts.com" (Left Card)

**Why:** This only shows files in `/public_html/` which is not where we need to upload.

---

## After Choosing "Access all files of Premium Web Hosting":

### Step 1: Navigate to Home Directory

1. **In File Manager**, you'll see folders like `public_html`, `logs`, etc.
2. **Navigate to:** `/home/u386122906/`
   - Look for folder path at top
   - Or navigate through folder structure

### Step 2: Create `cryptorafts` Folder

1. **You should be in:** `/home/u386122906/`
2. **Click "New folder"** button (top-left or in sidebar)
3. **Type:** `cryptorafts`
4. **Press Enter** or click "Create"
5. **Double-click `cryptorafts`** to enter it
6. **You should now be in:** `/home/u386122906/cryptorafts/`

### Step 3: Upload ALL Files

1. **You should be in:** `/home/u386122906/cryptorafts/`
2. **Click "Upload"** button (top of File Manager)
3. **Click "Select Files"** or drag and drop
4. **Navigate to:** `C:\Users\dell\cryptorafts-starter` on your computer
5. **Select ALL files and folders:**
   - ✅ **`src/`** folder (entire folder - MOST IMPORTANT!)
   - ✅ `package.json`
   - ✅ `next.config.js`
   - ✅ `server.js` (if exists)
   - ✅ `AUTOMATE_EVERYTHING_FINAL.sh` (this script!)
   - ✅ `DO_EVERYTHING_NOW.sh` (if exists)
   - ✅ `RUN_AFTER_UPLOAD.sh` (if exists)
   - ✅ All other files and folders

6. **Click "Upload"** or wait for automatic upload
7. **Wait for upload to complete** (5-10 minutes)

### Step 4: Verify Upload

1. **In File Manager**, check you're in: `/home/u386122906/cryptorafts/`
2. **You should see:**
   - ✅ `src/` folder
   - ✅ `package.json`
   - ✅ `next.config.js`
   - ✅ `AUTOMATE_EVERYTHING_FINAL.sh`

3. **Double-click `src` folder** → **Double-click `app` folder**
4. **You should see:** `page.tsx` file

**If `page.tsx` exists:** ✅ Files uploaded correctly!  
**If `page.tsx` missing:** Upload `src/` folder again!

### Step 5: Close File Manager

After verifying files are uploaded, close File Manager.

---

## Next Step: Run Deployment Script

After files are uploaded:

1. **Open SSH terminal** (PowerShell):
   ```powershell
   ssh -p 65002 u386122906@145.79.211.130
   ```
   Password: `Shamsi2627@@`

2. **After SSH connects, run:**
   ```bash
   bash AUTOMATE_EVERYTHING_FINAL.sh
   ```

---

## Summary

1. ✅ **Click:** "Access all files of Premium Web Hosting" (RIGHT card)
2. ✅ **Navigate to:** `/home/u386122906/`
3. ✅ **Create folder:** `cryptorafts`
4. ✅ **Upload files:** Especially `src/` folder
5. ✅ **Verify:** `src/app/page.tsx` exists
6. ✅ **Run:** `bash AUTOMATE_EVERYTHING_FINAL.sh` in SSH terminal

---

## Done! ✅

Visit: **https://www.cryptorafts.com**

Clear browser cache: `Ctrl+Shift+Delete`  
Hard refresh: `Ctrl+F5`

