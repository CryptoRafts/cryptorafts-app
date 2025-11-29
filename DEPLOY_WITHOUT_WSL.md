# 🚀 DEPLOYMENT WITHOUT WSL

Since WSL is not installed, here are the options:

## Option 1: Use FileZilla (EASIEST - Recommended)

### Step 1: Download FileZilla
https://filezilla-project.org/download.php?type=client

### Step 2: Connect to VPS
- **Host:** `sftp://145.79.211.130`
- **Port:** `65002`
- **Username:** `u386122906`
- **Password:** `Shmasi2627@@`
- Click **Quickconnect**

### Step 3: Upload Files
1. On the left (Local site): Navigate to `C:\Users\dell\cryptorafts-starter`
2. On the right (Remote site): Navigate to `/home/u386122906/cryptorafts/`
3. **IMPORTANT:** Upload the ENTIRE `src/` folder
   - Right-click on `src` folder → Upload
   - Make sure it includes `src/app/page.tsx`
4. Upload all other files too

### Step 4: SSH and Fix

Use **PuTTY** or **Windows Terminal** to SSH:

```bash
ssh -p 65002 u386122906@145.79.211.130
```

Password: `Shmasi2627@@`

Then run:

```bash
cd ~/cryptorafts
chmod +x FIX_EVERYTHING_VPS.sh
bash FIX_EVERYTHING_VPS.sh
```

Wait for it to complete (5-10 minutes).

### Step 5: Verify
Visit: https://www.cryptorafts.com

---

## Option 2: Install WSL (For Automated Deployment)

If you want automated deployment later:

```powershell
wsl --install
```

Then restart your computer and run the deployment scripts.

---

## Option 3: Use PowerShell SSH (Windows 10/11)

If you have OpenSSH installed in Windows:

```powershell
# Set password
$env:SSHPASS = "Shmasi2627@@"

# Upload files (if you have scp)
scp -P 65002 -r . u386122906@145.79.211.130:~/cryptorafts/
```

---

## Quick Summary

**FASTEST WAY:**
1. ✅ Download FileZilla
2. ✅ Connect: `145.79.211.130:65002`
3. ✅ Upload ALL files (especially `src/` folder)
4. ✅ SSH and run: `bash FIX_EVERYTHING_VPS.sh`
5. ✅ Visit: https://www.cryptorafts.com

**Time: 10-15 minutes**

