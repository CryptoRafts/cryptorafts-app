# 📤 FILEZILLA UPLOAD STEPS - FOLLOW THESE EXACTLY

## Step-by-Step FileZilla Instructions

### Step 1: Open FileZilla

1. Open FileZilla (you've already downloaded it)
2. You'll see two panels: **Local site** (left) and **Remote site** (right)

---

### Step 2: Connect to VPS

**At the top of FileZilla, enter:**

- **Host:** `sftp://145.79.211.130`
- **Port:** `65002`
- **Username:** `u386122906`
- **Password:** `Shamsi2627@@`
- **Protocol:** Select `SFTP - SSH File Transfer Protocol` from dropdown

**Click "Quickconnect"**

Wait for connection... You should see "Directory listing successful"

---

### Step 3: Navigate Folders

**LEFT SIDE (Local site):**
- Navigate to: `C:\Users\dell\cryptorafts-starter`
- You should see: `src`, `package.json`, `next.config.js`, etc.

**RIGHT SIDE (Remote site):**
- Navigate to: `/home/u386122906/`
- Right-click in the right panel → **Create Directory**
- Type: `cryptorafts`
- Press Enter
- **Double-click `cryptorafts`** to enter it
- You should now be in: `/home/u386122906/cryptorafts/`

---

### Step 4: Upload Files

**IMPORTANT: Upload the ENTIRE `src/` folder!**

1. **On the LEFT side:** Find the `src` folder
2. **Right-click on `src` folder**
3. Select **Upload**
4. Wait for upload to complete (may take 5-10 minutes)

**Also upload these files:**
- `package.json` (right-click → Upload)
- `next.config.js` (right-click → Upload)
- `server.js` (if exists - right-click → Upload)
- `FIX_NOW_SSH.sh` (if exists - right-click → Upload)
- `INSTALL_AND_DEPLOY_NO_SUDO.sh` (if exists - right-click → Upload)

**Upload ALL other files too!**

---

### Step 5: Verify Upload

**On the RIGHT side (Remote site), check:**
- You should see `src` folder
- Double-click `src` folder
- Double-click `app` folder
- You should see `page.tsx` file

**If `page.tsx` exists:** ✅ Files uploaded correctly!  
**If `page.tsx` missing:** Upload `src` folder again!

---

### Step 6: Close FileZilla

After upload is complete, close FileZilla.

---

## Next Step: Run Deployment Script

After files are uploaded, go to your **SSH terminal** and run:

```bash
cd ~/cryptorafts
bash INSTALL_AND_DEPLOY_NO_SUDO.sh
```

Or copy/paste the script content from `INSTALL_AND_DEPLOY_NO_SUDO.sh` into SSH terminal.

---

## Quick Checklist

- [ ] FileZilla downloaded and opened
- [ ] Connected to `sftp://145.79.211.130:65002`
- [ ] Created `cryptorafts` folder on remote side
- [ ] Navigated to `/home/u386122906/cryptorafts/` on remote side
- [ ] Navigated to `C:\Users\dell\cryptorafts-starter` on local side
- [ ] Uploaded ENTIRE `src/` folder
- [ ] Uploaded `package.json`
- [ ] Uploaded `next.config.js`
- [ ] Verified `src/app/page.tsx` exists after upload
- [ ] Closed FileZilla

---

## Troubleshooting

**If connection fails:**
- Check password: `Shamsi2627@@`
- Check port: `65002`
- Try again

**If upload fails:**
- Make sure you're in `/home/u386122906/cryptorafts/` on remote side
- Check file permissions
- Try uploading individual files instead of folder

---

## Done! ✅

After upload, run deployment script in SSH terminal!

