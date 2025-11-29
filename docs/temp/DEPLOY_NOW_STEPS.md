# 🚀 DEPLOY NOW - STEP BY STEP

You're connected to VPS! Follow these steps:

## Step 1: Upload Files to VPS

### Option A: FileZilla (EASIEST - Recommended)

1. **Download FileZilla:** https://filezilla-project.org/
2. **Connect:**
   - Host: `sftp://145.79.211.130`
   - Port: `65002`
   - Username: `u386122906`
   - Password: `Shamsi2627@@`
3. **Upload:**
   - Left panel: Navigate to `C:\Users\dell\cryptorafts-starter`
   - Right panel: Navigate to `/home/u386122906/cryptorafts/` (create folder if needed)
   - **IMPORTANT:** Upload the ENTIRE `src/` folder
   - Upload ALL files including:
     - `src/` (entire folder with `src/app/page.tsx`)
     - `package.json`
     - `next.config.js`
     - `FIX_EVERYTHING_VPS.sh`
     - Everything else

### Option B: SCP from PowerShell

If you have OpenSSH installed in Windows:

```powershell
.\UPLOAD_FILES_NOW.ps1
```

Enter password: `Shamsi2627@@` when prompted.

---

## Step 2: Run Fix Script on VPS

After files are uploaded, in your SSH terminal run:

```bash
# Create directory if it doesn't exist
mkdir -p ~/cryptorafts

# Navigate to directory
cd ~/cryptorafts

# Verify files are there
ls -la src/app/page.tsx

# If file exists, run fix script
chmod +x FIX_EVERYTHING_VPS.sh
bash FIX_EVERYTHING_VPS.sh
```

Wait for it to complete (5-10 minutes).

---

## Step 3: Verify

1. Wait 30 seconds for app to start
2. Visit: https://www.cryptorafts.com
3. Clear browser cache: Ctrl+Shift+Delete
4. Hard refresh: Ctrl+F5

---

## Quick Commands Summary

```bash
# In SSH terminal (already connected):
cd ~/cryptorafts
ls -la src/app/page.tsx  # Check if files are uploaded
bash FIX_EVERYTHING_VPS.sh  # Run fix
pm2 status  # Check app status
pm2 logs cryptorafts  # Check logs
```

---

## Current Status

✅ **Connected to VPS:** Yes  
❌ **Files uploaded:** No (need to upload)  
❌ **Fix script run:** No (waiting for upload)  

**Next:** Upload files via FileZilla, then run fix script!

