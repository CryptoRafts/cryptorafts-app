# 📤 HOSTINGER FILE MANAGER - STEP-BY-STEP UPLOAD

## Since Hostinger is Open - Follow These Exact Steps:

### Step 1: Open File Manager

1. **In Hostinger hPanel** (already open)
2. **Look for "File Manager"** in the left sidebar
3. **Click "File Manager"**
4. File Manager opens in your browser

---

### Step 2: Navigate to Your Home Directory

1. **In File Manager**, you'll see a folder tree on the left
2. **Navigate to:** `/home/u386122906/`
   - Click through: `home` → `u386122906`
   - OR type in the path bar at top: `/home/u386122906/`

---

### Step 3: Create `cryptorafts` Folder

1. **In the main area** (right side), you'll see files/folders
2. **Click "New Folder"** button (usually at top)
3. **Type:** `cryptorafts`
4. **Press Enter** or click "Create"
5. **Double-click `cryptorafts`** to enter it
6. You should now be in: `/home/u386122906/cryptorafts/`

---

### Step 4: Upload Files

1. **Click "Upload"** button (top of File Manager)
2. **Click "Select Files"** or drag and drop files
3. **In the file picker**, navigate to: `C:\Users\dell\cryptorafts-starter`
4. **Select files to upload:**

   **CRITICAL - Upload these:**
   - ✅ `src/` folder (entire folder - most important!)
   - ✅ `package.json`
   - ✅ `next.config.js`
   - ✅ `server.js` (if exists)
   - ✅ `RUN_AFTER_UPLOAD.sh` (if exists)
   - ✅ `INSTALL_AND_DEPLOY_NO_SUDO.sh` (if exists)
   - ✅ All other files and folders

5. **Click "Upload"** or wait for automatic upload
6. **Wait for upload to complete** (may take 5-10 minutes)

---

### Step 5: Verify Upload

1. **In File Manager**, navigate to: `/home/u386122906/cryptorafts/`
2. **Check these exist:**
   - ✅ `src/` folder
   - ✅ `src/app/` folder
   - ✅ `src/app/page.tsx` file
   - ✅ `package.json`
   - ✅ `next.config.js`

3. **If `src/app/page.tsx` exists:** ✅ Files uploaded correctly!
4. **If `src/app/page.tsx` missing:** Upload `src/` folder again!

---

### Step 6: Close File Manager

After verifying files are uploaded, close File Manager.

---

## Next Step: Run Deployment Script in SSH

After files are uploaded:

1. **Open SSH terminal** (you already have one open)
2. **Run these commands ONE BY ONE:**

```bash
# Navigate to directory
cd ~/cryptorafts

# Check if files exist
ls -la src/app/page.tsx

# If file exists, continue with deployment:
```

3. **If file exists, run deployment script:**

```bash
bash RUN_AFTER_UPLOAD.sh
```

**OR** copy and paste the entire script content from `RUN_AFTER_UPLOAD.sh` into SSH terminal.

---

## If Upload Fails in File Manager:

### Try Uploading Folder by Folder:

1. **Create folder structure:**
   - Create `src` folder
   - Create `src/app` folder

2. **Upload files individually:**
   - Upload `src/app/page.tsx`
   - Upload other files one by one

3. **This is slower but more reliable**

---

## Quick Checklist:

- [ ] File Manager opened
- [ ] Navigated to `/home/u386122906/`
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

## After Upload - Deployment Commands:

**In SSH terminal, run:**

```bash
cd ~/cryptorafts
ls -la src/app/page.tsx  # Verify file exists
bash RUN_AFTER_UPLOAD.sh  # Run deployment
```

**OR copy/paste this script into SSH:**

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm install 18 && nvm use 18 && cd ~/cryptorafts && npm install --production && rm -rf .next out && NODE_ENV=production npm run build && cat > server.js << 'EOF'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
EOF
npm install -g pm2 && pm2 stop cryptorafts || true && pm2 delete cryptorafts || true && pm2 start server.js --name cryptorafts && pm2 save && echo "✅ Done! Visit https://www.cryptorafts.com"
```

---

## Done! ✅

After deployment script completes:
- Wait 30 seconds
- Clear browser cache: `Ctrl+Shift+Delete`
- Hard refresh: `Ctrl+F5`
- Visit: **https://www.cryptorafts.com**

---

## Troubleshooting:

**If files won't upload:**
- Try uploading smaller batches
- Check file permissions
- Try uploading folder by folder

**If deployment fails:**
- Check SSH terminal for errors
- Verify all files uploaded correctly
- Run commands one by one to see where it fails

