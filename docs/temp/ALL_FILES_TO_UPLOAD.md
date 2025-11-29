# 📦 All Files to Upload to VPS

## Fixed Source Files

Upload these files to `/var/www/cryptorafts/` on your VPS:

### 1. Core Application Files

1. **`src/app/page.tsx`**
   - Location: `src/app/page.tsx`
   - Upload to: `/var/www/cryptorafts/src/app/page.tsx`
   - Fix: Added `force-dynamic` to disable streaming

2. **`src/app/HomePageClient.tsx`**
   - Location: `src/app/HomePageClient.tsx`
   - Upload to: `/var/www/cryptorafts/src/app/HomePageClient.tsx`
   - Fix: Added `suppressHydrationWarning` to prevent streaming issues

3. **`src/components/PerfectHeader.tsx`**
   - Location: `src/components/PerfectHeader.tsx`
   - Upload to: `/var/www/cryptorafts/src/components/PerfectHeader.tsx`
   - Fix: Removed debug console logs

### 2. Deployment Scripts

4. **`FINAL_DEPLOYMENT_COMPLETE.sh`**
   - Location: `FINAL_DEPLOYMENT_COMPLETE.sh`
   - Upload to: `/var/www/cryptorafts/FINAL_DEPLOYMENT_COMPLETE.sh`
   - Purpose: Complete deployment script

5. **`NGINX_CONFIG_CHECK.sh`**
   - Location: `NGINX_CONFIG_CHECK.sh`
   - Upload to: `/var/www/cryptorafts/NGINX_CONFIG_CHECK.sh`
   - Purpose: Nginx configuration checker

6. **`COMPREHENSIVE_VPS_DIAGNOSTIC.sh`**
   - Location: `COMPREHENSIVE_VPS_DIAGNOSTIC.sh`
   - Upload to: `/var/www/cryptorafts/COMPREHENSIVE_VPS_DIAGNOSTIC.sh`
   - Purpose: Comprehensive diagnostic script

---

## Upload Methods

### Method 1: Using Upload Scripts

**Windows PowerShell:**
```powershell
.\UPLOAD_ALL_FILES.ps1
```

**Linux/Mac:**
```bash
chmod +x UPLOAD_ALL_FILES.sh
./UPLOAD_ALL_FILES.sh
```

### Method 2: Using Hostinger hPanel File Manager

1. Login to: https://hpanel.hostinger.com/
2. Go to: File Manager
3. Navigate to: `/var/www/cryptorafts/`
4. Upload files using the upload button

### Method 3: Using SCP (Command Line)

**Windows PowerShell:**
```powershell
$VPS_IP = "YOUR_VPS_IP"
$VPS_USER = "root"

scp src\app\page.tsx ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/src/app/page.tsx
scp src\app\HomePageClient.tsx ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/src/app/HomePageClient.tsx
scp src\components\PerfectHeader.tsx ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/src/components/PerfectHeader.tsx
scp FINAL_DEPLOYMENT_COMPLETE.sh ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/
scp NGINX_CONFIG_CHECK.sh ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/
scp COMPREHENSIVE_VPS_DIAGNOSTIC.sh ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/
```

**Linux/Mac:**
```bash
VPS_IP="YOUR_VPS_IP"
VPS_USER="root"

scp src/app/page.tsx ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/src/app/page.tsx
scp src/app/HomePageClient.tsx ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/src/app/HomePageClient.tsx
scp src/components/PerfectHeader.tsx ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/src/components/PerfectHeader.tsx
scp FINAL_DEPLOYMENT_COMPLETE.sh ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/
scp NGINX_CONFIG_CHECK.sh ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/
scp COMPREHENSIVE_VPS_DIAGNOSTIC.sh ${VPS_USER}@${VPS_IP}:/var/www/cryptorafts/
```

---

## After Uploading

Once files are uploaded, SSH into VPS and run:

```bash
cd /var/www/cryptorafts
chmod +x *.sh
./FINAL_DEPLOYMENT_COMPLETE.sh
```

---

## File Summary

| File | Size | Purpose |
|------|------|---------|
| `src/app/page.tsx` | ~500 bytes | Main page component (fixed) |
| `src/app/HomePageClient.tsx` | ~20 KB | Homepage client component (fixed) |
| `src/components/PerfectHeader.tsx` | ~15 KB | Header component (fixed) |
| `FINAL_DEPLOYMENT_COMPLETE.sh` | ~5 KB | Deployment script |
| `NGINX_CONFIG_CHECK.sh` | ~4 KB | Nginx checker |
| `COMPREHENSIVE_VPS_DIAGNOSTIC.sh` | ~8 KB | Diagnostic script |

---

**Total Files**: 6 files  
**Total Size**: ~52 KB  
**Status**: ✅ Ready for Upload







