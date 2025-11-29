# 🔍 DNS & Server Configuration Check Guide

## ✅ **CURRENT STATUS:**

- ✅ **Server:** Running on port 3000 (HTTP 200 OK)
- ✅ **PM2:** Online and running
- ✅ **Nginx:** Active and running
- ✅ **Build:** Completed successfully
- ⚠️ **Next.js Error:** clientReferenceManifest issue (being fixed)

## 🔧 **ISSUE IDENTIFIED:**

There's a Next.js error in the logs:
```
Error [InvariantError]: Invariant: Expected clientReferenceManifest to be defined.
```

This is causing the "Loading..." issue. The build artifacts exist but may be incomplete.

## 🚀 **FIX STEPS:**

### **Option 1: Run Fix Script on VPS (Recommended)**

1. **SSH into VPS:**
   ```bash
   ssh root@72.61.98.99
   ```

2. **Navigate to project:**
   ```bash
   cd /var/www/cryptorafts
   ```

3. **Run the fix script:**
   ```bash
   chmod +x FIX_NEXTJS_ERROR.sh
   bash FIX_NEXTJS_ERROR.sh
   ```

### **Option 2: Manual Fix on VPS**

1. **SSH into VPS:**
   ```bash
   ssh root@72.61.98.99
   cd /var/www/cryptorafts
   ```

2. **Stop PM2:**
   ```bash
   pm2 stop cryptorafts
   ```

3. **Clean build:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run build
   ```

4. **Restart PM2:**
   ```bash
   pm2 restart cryptorafts --update-env
   pm2 status
   ```

## 🌐 **DNS CONFIGURATION CHECK:**

### **In Hostinger Panel:**

1. **Go to:** https://hpanel.hostinger.com/
2. **Navigate to:** Domains → DNS Zone Editor
3. **Check these records:**

   **A Record:**
   - Name: `@` or `cryptorafts.com`
   - Value: `72.61.98.99` (your VPS IP)
   - TTL: 3600

   **A Record (www):**
   - Name: `www`
   - Value: `72.61.98.99` (your VPS IP)
   - TTL: 3600

   **CNAME (if needed):**
   - Name: `www`
   - Value: `cryptorafts.com`
   - TTL: 3600

### **Verify DNS Propagation:**

Check if DNS is propagated:
```bash
# Check A record
nslookup cryptorafts.com
nslookup www.cryptorafts.com

# Check from different locations
dig cryptorafts.com
dig www.cryptorafts.com
```

## 🔍 **NGINX CONFIGURATION:**

The nginx configuration should proxy requests to port 3000:

```nginx
server {
    listen 80;
    server_name cryptorafts.com www.cryptorafts.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ✅ **VERIFICATION:**

After running the fix:

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs cryptorafts --lines 20 --nostream
   ```

2. **Test server locally:**
   ```bash
   curl -I http://localhost:3000
   ```

3. **Test from browser:**
   - Visit: https://www.cryptorafts.com
   - Clear browser cache (Ctrl+Shift+R)
   - Check if full site loads

## 📝 **FILES CREATED:**

- ✅ `FIX_NEXTJS_ERROR.sh` - Complete fix script
- ✅ `DNS_CHECK_GUIDE.md` - This guide

## ⚠️ **IMPORTANT:**

After fixing, **clear your browser cache**:
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or use Incognito/Private mode
- Or clear cache in browser settings

---

**Status:** ✅ **Fix script ready - Run on VPS to resolve Next.js error**

