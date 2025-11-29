# 🚀 QUICK FIX - MANUAL STEPS

Since automated upload is taking time, here's a faster manual approach:

## Step 1: Upload Files Using FileZilla/WinSCP

### Using FileZilla (Recommended):
1. Download FileZilla: https://filezilla-project.org/
2. Connect with these settings:
   - **Host:** 145.79.211.130
   - **Port:** 65002
   - **Username:** u386122906
   - **Password:** Shmasi2627@@
   - **Protocol:** SFTP

3. Upload ALL files from `C:\Users\dell\cryptorafts-starter` to `/home/u386122906/cryptorafts/`

**IMPORTANT:** Make sure to upload:
- ✅ `src/` folder (entire folder)
- ✅ `package.json`
- ✅ `next.config.js`
- ✅ `.next/` folder (if exists)
- ✅ Everything else

### Using WinSCP:
1. Download WinSCP: https://winscp.net/
2. Same connection settings as above
3. Drag and drop ALL files

## Step 2: SSH and Fix

After uploading, SSH to VPS:

```bash
ssh -p 65002 u386122906@145.79.211.130
```

Then run:

```bash
cd ~/cryptorafts
chmod +x FIX_EVERYTHING_VPS.sh
bash FIX_EVERYTHING_VPS.sh
```

This will:
- ✅ Verify src/app exists
- ✅ Install dependencies
- ✅ Clean and rebuild app
- ✅ Start app with PM2
- ✅ Fix Nginx
- ✅ Make app LIVE

## Step 3: Verify

Wait 30 seconds, then visit:
- https://www.cryptorafts.com
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

---

## Alternative: Quick Upload Script

If you want to try automated again, run:

```powershell
.\DEPLOY_NOW_SIMPLE.ps1
```

But FileZilla/WinSCP is often faster and more reliable for large uploads.

