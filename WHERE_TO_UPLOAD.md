# 📤 WHERE TO UPLOAD FILES - EXACT LOCATIONS

## FileZilla Upload Locations

### FROM (Local Computer):
```
C:\Users\dell\cryptorafts-starter
```

### TO (VPS Server):
```
/home/u386122906/cryptorafts/
```

---

## Step-by-Step FileZilla Instructions

### Step 1: Download FileZilla
https://filezilla-project.org/download.php?type=client

### Step 2: Open FileZilla and Connect

**Host:** `sftp://145.79.211.130`  
**Port:** `65002`  
**Username:** `u386122906`  
**Password:** `Shamsi2627@@`  
**Protocol:** `SFTP - SSH File Transfer Protocol`

Click **Quickconnect**

### Step 3: Navigate Folders

**LEFT SIDE (Local):**
- Navigate to: `C:\Users\dell\cryptorafts-starter`

**RIGHT SIDE (Remote):**
- Navigate to: `/home/u386122906/`
- Create folder `cryptorafts` if it doesn't exist (right-click → Create Directory)
- Navigate into: `/home/u386122906/cryptorafts/`

### Step 4: Upload Files

**IMPORTANT:** Upload the ENTIRE `src/` folder!

1. **On the LEFT side:** Find the `src` folder
2. **Right-click on `src` folder** → Select **Upload**
3. **Make sure** it uploads `src/app/page.tsx`

**Also upload:**
- ✅ `package.json`
- ✅ `next.config.js`
- ✅ `.env.local` (if exists)
- ✅ All other files and folders
- ✅ `FIX_NOW_SSH.sh` (optional - can copy script instead)

### Step 5: Verify Upload

After upload, you should see:
```
/home/u386122906/cryptorafts/
├── src/
│   └── app/
│       └── page.tsx  ← THIS MUST EXIST!
├── package.json
├── next.config.js
└── ... (other files)
```

---

## Alternative: Upload to Different Location

If `/home/u386122906/cryptorafts/` doesn't work, try:
```
/var/www/cryptorafts/
```

But first, you need to create it:
1. In FileZilla, right-click in remote directory
2. Click "Create Directory"
3. Type: `cryptorafts`
4. Navigate into it
5. Upload files there

---

## Quick Checklist

- [ ] FileZilla downloaded and installed
- [ ] Connected to VPS (sftp://145.79.211.130:65002)
- [ ] Navigated to `/home/u386122906/cryptorafts/` on remote side
- [ ] Navigated to `C:\Users\dell\cryptorafts-starter` on local side
- [ ] Uploaded ENTIRE `src/` folder
- [ ] Verified `src/app/page.tsx` exists after upload
- [ ] Uploaded `package.json` and `next.config.js`

---

## Visual Guide

```
FileZilla Window:
┌─────────────────────────────────────────────┐
│  Local site:              Remote site:      │
│  C:\Users\dell\          /home/u386122906/│
│  └── cryptorafts-starter  └── cryptorafts/  │
│      ├── src/              (create if missing)│
│      ├── package.json                         │
│      └── ...                                  │
│                                               │
│  Select "src" folder    →  Upload to here    │
└─────────────────────────────────────────────┘
```

---

## After Upload

Once files are uploaded, SSH to VPS and run:
```bash
cd ~/cryptorafts
ls -la src/app/page.tsx  # Verify file exists
bash FIX_NOW_SSH.sh      # Run fix script
```

---

## Summary

**Upload FROM:** `C:\Users\dell\cryptorafts-starter`  
**Upload TO:** `/home/u386122906/cryptorafts/`  
**Critical:** Upload the entire `src/` folder!

