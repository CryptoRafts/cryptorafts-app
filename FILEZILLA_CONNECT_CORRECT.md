# ✅ CORRECT FILEZILLA CONNECTION SETTINGS

## ⚠️ IMPORTANT: Do NOT use `sftp://` in Host field!

The error "EAI_NONAME" is because FileZilla can't parse `sftp://145.79.211.130`.

## ✅ Correct FileZilla Settings:

**In FileZilla, use these EXACT settings:**

### Host Field:
```
145.79.211.130
```
**NOT:** `sftp://145.79.211.130` ❌  
**YES:** `145.79.211.130` ✅

### Port Field:
```
65002
```

### Protocol Dropdown:
Select from dropdown: **SFTP - SSH File Transfer Protocol**

**NOT:** FTP or FTP over TLS  
**YES:** SFTP - SSH File Transfer Protocol

### Username:
```
u386122906
```

### Password:
```
Shamsi2627@@
```

### Logon Type:
**Normal**

---

## Step-by-Step:

1. **Open FileZilla**
2. **At the top**, you'll see connection fields:
   - **Host:** Type `145.79.211.130` (NO `sftp://`)
   - **Username:** Type `u386122906`
   - **Password:** Type `Shamsi2627@@`
   - **Port:** Type `65002`
   - **Protocol:** Select from dropdown **SFTP - SSH File Transfer Protocol**
3. **Click "Quickconnect"**

---

## If Still Not Connecting:

### Alternative Method 1: Use File Manager

1. **Go to Hostinger hPanel:** https://hpanel.hostinger.com/
2. **Login**
3. **Click "File Manager"** in sidebar
4. **Navigate to:** `/home/u386122906/`
5. **Create folder:** `cryptorafts`
6. **Upload files** via File Manager web interface

### Alternative Method 2: Use WinSCP (Windows)

1. **Download WinSCP:** https://winscp.net/
2. **Connect:**
   - **File Protocol:** SFTP
   - **Host name:** `145.79.211.130`
   - **Port number:** `65002`
   - **User name:** `u386122906`
   - **Password:** `Shamsi2627@@`
3. **Click "Login"**

---

## After Connecting Successfully:

### Upload Files:

1. **LEFT SIDE (Local):**
   - Navigate to: `C:\Users\dell\cryptorafts-starter`

2. **RIGHT SIDE (Remote):**
   - Navigate to: `/home/u386122906/cryptorafts/`
   - If folder doesn't exist: Right-click → Create Directory → Type: `cryptorafts`

3. **Upload:**
   - **IMPORTANT:** Right-click on `src` folder → Upload (entire folder!)
   - Right-click on `package.json` → Upload
   - Right-click on `next.config.js` → Upload
   - Upload all other files too!

4. **Verify:**
   - On right side: `/home/u386122906/cryptorafts/src/app/page.tsx` should exist

---

## Troubleshooting:

**If connection still fails:**
- Try without port (FileZilla might auto-detect SFTP port 22)
- Check firewall settings
- Try WinSCP instead
- Use Hostinger File Manager (web interface - no connection needed!)

---

## Next Step:

After files are uploaded, go to **SSH terminal** and run:

```bash
cd ~/cryptorafts
bash RUN_AFTER_UPLOAD.sh
```

Or copy/paste the script from `RUN_AFTER_UPLOAD.sh` into SSH terminal.

---

## Done! ✅

Visit: **https://www.cryptorafts.com**

Clear browser cache: `Ctrl+Shift+Delete`  
Hard refresh: `Ctrl+F5`

