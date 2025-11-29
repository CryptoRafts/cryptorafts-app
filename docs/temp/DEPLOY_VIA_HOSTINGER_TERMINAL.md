# 🚀 DEPLOY VIA HOSTINGER WEB TERMINAL

Since SSH password is not working, use Hostinger's built-in terminal (NO PASSWORD NEEDED):

## Step 1: Open Hostinger Terminal

1. **Login to Hostinger:** https://hpanel.hostinger.com/
2. **Go to VPS:** https://hpanel.hostinger.com/vps/1097850/overview
3. **Look for "Terminal"** or **"Web Terminal"** button
4. **Click to open** - Opens in your browser, no SSH needed!

## Step 2: Upload Files First

Before using terminal, you need to upload files:

### Option A: Use FileZilla
1. Download: https://filezilla-project.org/
2. Connect:
   - Host: `sftp://145.79.211.130`
   - Port: `65002`
   - Username: `u386122906`
   - Password: (Get from Hostinger panel → FTP/SFTP section)
3. Upload ALL files from `C:\Users\dell\cryptorafts-starter` to `/home/u386122906/cryptorafts/`

### Option B: Use Hostinger File Manager
1. In Hostinger panel, click **"File Manager"**
2. Navigate to `/home/u386122906/cryptorafts/`
3. Upload files via web interface

## Step 3: Run Commands in Terminal

After files are uploaded, in Hostinger terminal run:

```bash
# Navigate to app directory
cd ~/cryptorafts
# Or if files are in /var/www
cd /var/www/cryptorafts

# Check if files are there
ls -la src/app/page.tsx

# If files are missing, they need to be uploaded first!

# Run fix script
chmod +x FIX_EVERYTHING_VPS.sh
bash FIX_EVERYTHING_VPS.sh
```

## Step 4: Verify

After script completes:
- Visit: https://www.cryptorafts.com
- Clear browser cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+F5

---

## Quick Summary

**No SSH password needed!**
1. ✅ Open Hostinger Web Terminal
2. ✅ Upload files via FileZilla or File Manager
3. ✅ Run: `bash FIX_EVERYTHING_VPS.sh`
4. ✅ Done!

