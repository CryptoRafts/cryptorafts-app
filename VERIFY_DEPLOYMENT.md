# VPS Deployment Verification Guide

## Quick Deployment Commands

### Option 1: Full Deployment (Recommended)
```bash
# On VPS, run:
cd /var/www/cryptorafts
chmod +x DEPLOY_FRESH_BUILD_VPS.sh
./DEPLOY_FRESH_BUILD_VPS.sh
```

### Option 2: Quick Deployment
```bash
# On VPS, run:
cd /var/www/cryptorafts
chmod +x DEPLOY_FRESH_BUILD_VPS_QUICK.sh
./DEPLOY_FRESH_BUILD_VPS_QUICK.sh
```

### Option 3: Manual Step-by-Step
```bash
# On VPS:
cd /var/www/cryptorafts

# 1. Stop PM2
pm2 stop cryptorafts

# 2. Clean cache
rm -rf .next/cache

# 3. Rebuild
npm run build

# 4. Restart PM2
pm2 restart cryptorafts
```

---

## Post-Deployment Verification

### 1. Server Health Check
```bash
# Check PM2 status
pm2 status cryptorafts

# Check server response
curl -I http://127.0.0.1:3000/

# Check HTML content
curl -s http://127.0.0.1:3000/ | grep -q "WELCOME TO CRYPTORAFTS" && echo "✅ Content found" || echo "❌ Content missing"
```

### 2. Browser Testing (Critical)

1. **Open Incognito Window** (Ctrl + Shift + N)
2. **Navigate to**: `https://www.cryptorafts.com`
3. **Check**:
   - ✅ Full page content renders immediately
   - ✅ Hero section shows "WELCOME TO CRYPTORAFTS"
   - ✅ Video background loads (or fallback image shows)
   - ✅ All sections visible (Features, Stats, Network Stats, CTA)
   - ✅ No blank/white screen

### 3. Browser Console Check

1. **Open Developer Tools** (F12)
2. **Check Console Tab**:
   - ✅ No hydration warnings
   - ✅ No JavaScript errors
   - ✅ No network errors

3. **Check Network Tab**:
   - ✅ All CSS files load (200 OK)
   - ✅ All JS chunks load (200 OK)
   - ✅ Video/image assets load (200 OK)
   - ✅ No 404 errors

### 4. Nginx Configuration Verification

```bash
# Verify Nginx is pointing to correct port
grep -r "127.0.0.1:3000" /etc/nginx/

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Check Nginx access logs
tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### Issue: Content Still Not Rendering

**Check 1: PM2 Logs**
```bash
pm2 logs cryptorafts --lines 50
```

**Check 2: Build Output**
```bash
cd /var/www/cryptorafts
ls -la .next/
ls -la .next/static/
```

**Check 3: Environment Variables**
```bash
# Check if PM2 has environment variables
pm2 env cryptorafts

# Verify required variables are set:
# - NEXT_PUBLIC_FIREBASE_PROJECT_ID
# - NEXT_PUBLIC_FIREBASE_API_KEY
# - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```

**Check 4: Static Assets**
```bash
cd /var/www/cryptorafts
ls -la public/Sequence\ 01.mp4
ls -la public/homapage\ \(3\).png
ls -la public/cryptorafts.logo\ \(1\).svg
```

### Issue: Server Not Responding

**Check 1: PM2 Status**
```bash
pm2 status
pm2 restart cryptorafts
```

**Check 2: Port Availability**
```bash
netstat -tulpn | grep 3000
# Should show Node.js process listening on port 3000
```

**Check 3: Firewall**
```bash
# If using ufw
sudo ufw status
sudo ufw allow 3000/tcp
```

### Issue: Nginx Not Serving Content

**Check 1: Nginx Configuration**
```bash
# Verify Nginx config
sudo nginx -t

# Check site configuration
cat /etc/nginx/sites-enabled/cryptorafts
# Should have proxy_pass to http://127.0.0.1:3000
```

**Check 2: Nginx Status**
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

---

## Success Indicators

✅ **PM2 Status**: `online`  
✅ **Server Response**: `200 OK`  
✅ **HTML Content**: Contains "WELCOME TO CRYPTORAFTS"  
✅ **Browser Console**: No hydration warnings or errors  
✅ **Network Tab**: All assets load with 200 OK  
✅ **Page Rendering**: Full content visible immediately  

---

## Files Modified in This Fix

- ✅ `src/app/HomePageClient.tsx` - Fixed video element hydration mismatch
- ✅ `src/app/HomePageClient.tsx` - Fixed fallback image hydration mismatch
- ✅ Added `suppressHydrationWarning` to prevent hydration errors
- ✅ Added `typeof window !== 'undefined'` checks to all event handlers

---

## Expected Behavior After Fix

1. **Server renders** with `videoLoaded = false` → fallback image visible
2. **Client hydrates** → video loads → `videoLoaded = true` → video shows
3. **No hydration mismatch** → React doesn't suppress hydration
4. **Content renders** → Full page visible immediately

---

**Last Updated**: $(date)  
**Status**: ✅ Ready for Deployment







