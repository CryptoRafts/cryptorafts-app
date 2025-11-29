# 🚀 FRESH BUILD AND DEPLOY - INSTRUCTIONS

## Quick Deploy (Recommended)

### Option 1: Auto Deploy with Password

```powershell
.\FRESH_BUILD_DEPLOY_AUTO.ps1 -VPS_PASSWORD "your_ssh_password_here"
```

This will:
1. ✅ Clean old build
2. ✅ Build fresh application
3. ✅ Upload ALL files to VPS
4. ✅ Deploy on VPS
5. ✅ Make app LIVE

**Total time: 10-15 minutes**

---

### Option 2: Interactive Deploy

```powershell
.\FRESH_BUILD_DEPLOY.ps1
```

When prompted, enter your SSH password.

---

## Manual Deploy (If Scripts Don't Work)

### Step 1: Build Locally

```powershell
# Clean old build
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path "out" -Recurse -Force

# Build fresh
npm run build
```

### Step 2: Upload to VPS

```powershell
# Using WSL
wsl
cd /mnt/c/Users/dell/cryptorafts-starter
sshpass -e scp -P 65002 -r . u386122906@145.79.211.130:~/cryptorafts/
```

Or using FileZilla/WinSCP:
- **Host:** 145.79.211.130
- **Port:** 65002
- **Username:** u386122906
- **Password:** Your SSH password
- **Remote path:** ~/cryptorafts/

### Step 3: Deploy on VPS

```bash
# SSH to VPS
ssh -p 65002 u386122906@145.79.211.130

# Run deployment script
cd ~/cryptorafts
chmod +x FIX_EVERYTHING_VPS.sh
bash FIX_EVERYTHING_VPS.sh
```

---

## What Gets Fixed

The `FIX_EVERYTHING_VPS.sh` script will:
1. ✅ Verify `src/app/` exists (fixes "No pages detected")
2. ✅ Install dependencies
3. ✅ Clean old build
4. ✅ Rebuild application
5. ✅ Start app with PM2
6. ✅ Fix Nginx configuration (fixes MIME type errors)
7. ✅ Make app LIVE

---

## After Deployment

1. **Clear browser cache:** `Ctrl+Shift+Delete`
2. **Hard refresh:** `Ctrl+F5`
3. **Visit:** https://www.cryptorafts.com

---

## Troubleshooting

### Still seeing errors?

```bash
# SSH to VPS
ssh -p 65002 u386122906@145.79.211.130

# Check app status
pm2 status
pm2 logs cryptorafts

# Check app response
curl http://localhost:3000

# Check static files
ls -la ~/cryptorafts/.next/static/chunks/

# Re-run fix
bash FIX_EVERYTHING_VPS.sh
```

---

## VPS Credentials

- **IP:** 145.79.211.130
- **Port:** 65002
- **Username:** u386122906
- **Password:** (Your SSH password from Hostinger)

---

## Summary

**The issue:** "No pages detected" + MIME type errors

**The cause:** `src/app/` missing on VPS OR build not running correctly

**The fix:** Upload ALL files + Run `FIX_EVERYTHING_VPS.sh`

**The result:** App working perfectly! 🎉

