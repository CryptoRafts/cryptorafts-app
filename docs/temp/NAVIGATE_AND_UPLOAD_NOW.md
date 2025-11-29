# 📤 NAVIGATE AND UPLOAD FILES NOW

## ✅ You're in Hostinger File Manager!

You're currently in `/public_html/` but you need to upload to `/home/u386122906/cryptorafts/`

---

## Step 1: Navigate to Home Directory

### In File Manager (where you are now):

1. **Look at the top** - you'll see a breadcrumb: `Home > public_html`
2. **Click "Home"** in the breadcrumb (or type in path bar: `/home/u386122906/`)
3. **You should see folders** like `public_html`, `logs`, etc.

---

## Step 2: Create `cryptorafts` Folder

1. **Make sure you're in:** `/home/u386122906/` (click "Home" if not)
2. **Click "New folder"** button (usually top-left or in sidebar)
3. **Type:** `cryptorafts`
4. **Press Enter** or click "Create"
5. **Double-click `cryptorafts`** to enter it
6. **You should now be in:** `/home/u386122906/cryptorafts/`

---

## Step 3: Upload Files

1. **You should be in:** `/home/u386122906/cryptorafts/`
2. **Click "Upload"** button (usually at top of File Manager)
3. **Click "Select Files"** or drag and drop
4. **Navigate to:** `C:\Users\dell\cryptorafts-starter` on your computer
5. **Select these files/folders:**
   - ✅ `src/` folder (entire folder - MOST IMPORTANT!)
   - ✅ `package.json`
   - ✅ `next.config.js`
   - ✅ `server.js` (if exists)
   - ✅ `RUN_AFTER_UPLOAD.sh` (if exists)
   - ✅ All other files and folders

6. **Click "Upload"** or wait for automatic upload
7. **Wait for upload to complete** (may take 5-10 minutes)

---

## Step 4: Verify Upload

### In File Manager, check:

1. **You should be in:** `/home/u386122906/cryptorafts/`
2. **You should see:**
   - ✅ `src/` folder
   - ✅ `package.json`
   - ✅ `next.config.js`

3. **Double-click `src` folder** to open it
4. **Double-click `app` folder** to open it
5. **You should see:** `page.tsx` file

**If `page.tsx` exists:** ✅ Files uploaded correctly!  
**If `page.tsx` missing:** Upload `src/` folder again!

---

## Step 5: Close File Manager

After verifying files are uploaded, close File Manager.

---

## Next Step: Run Deployment Script

After files are uploaded:

1. **Open your SSH terminal** (you already have it open)
2. **Run these commands ONE BY ONE:**

```bash
# Navigate to directory
cd ~/cryptorafts

# Verify files exist
ls -la src/app/page.tsx

# If file exists, run deployment
bash RUN_AFTER_UPLOAD.sh
```

**OR** copy and paste all commands from `DEPLOYMENT_COMMAND_SIMPLE.txt`

---

## Quick Checklist:

- [ ] Navigated to `/home/u386122906/` (click "Home")
- [ ] Created `cryptorafts` folder
- [ ] Entered `cryptorafts` folder
- [ ] Clicked "Upload" button
- [ ] Selected files from `C:\Users\dell\cryptorafts-starter`
- [ ] Uploaded `src/` folder (entire folder!)
- [ ] Uploaded `package.json`
- [ ] Uploaded `next.config.js`
- [ ] Verified `src/app/page.tsx` exists
- [ ] Closed File Manager

---

## Important Notes:

⚠️ **DO NOT upload to `public_html/`**  
✅ **Upload to `/home/u386122906/cryptorafts/`**

⚠️ **Make sure you're in the correct directory before uploading!**

✅ **Most important file to upload:** `src/` folder (entire folder!)

---

## After Upload:

**In SSH terminal, run:**

```bash
cd ~/cryptorafts
ls -la src/app/page.tsx  # Should show the file
bash RUN_AFTER_UPLOAD.sh  # Run deployment
```

**This will:**
- Install Node.js (via NVM - no sudo needed)
- Install dependencies
- Build application
- Start app with PM2
- Make app LIVE

---

## Done! ✅

Visit: **https://www.cryptorafts.com**

Clear browser cache: `Ctrl+Shift+Delete`  
Hard refresh: `Ctrl+F5`

