# 🚀 COMPLETE DEPLOYMENT INSTRUCTIONS

## Quick Deployment Guide

Your app at **https://www.cryptorafts.com** needs to be fixed and redeployed. Here's how to do it:

## Option 1: Manual Deployment (Recommended)

### Step 1: SSH into your VPS

```bash
ssh root@72.61.98.99
# Password: Shamsi2627@@
```

### Step 2: Navigate to app directory

```bash
cd /var/www/cryptorafts
```

### Step 3: Create/Update .env.local

```bash
cat > .env.local << 'EOF'
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com

# Admin Configuration
ADMIN_EMAIL=anasshamsiggc@gmail.com
SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com
EOF
```

### Step 4: Rebuild the application

```bash
npm run build
```

This will take 2-3 minutes. Wait for it to complete.

### Step 5: Restart PM2

```bash
pm2 restart cryptorafts
# OR if that fails:
pm2 start ecosystem.config.js
```

### Step 6: Reload nginx

```bash
systemctl reload nginx
```

### Step 7: Verify deployment

```bash
pm2 status
curl -I http://localhost:3000
```

## Option 2: Upload Files and Deploy

### Step 1: Upload files from your local machine

From your Windows machine, run these commands (you'll need to enter password: Shamsi2627@@):

```powershell
# Upload page.tsx
scp src/app/page.tsx root@72.61.98.99:/var/www/cryptorafts/src/app/page.tsx

# Upload components
scp src/components/SpotlightDisplay.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/SpotlightDisplay.tsx
scp src/components/RealtimeStats.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/RealtimeStats.tsx
scp src/components/ErrorBoundary.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/ErrorBoundary.tsx
scp src/components/PerfectHeader.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/PerfectHeader.tsx

# Upload firebase config
scp src/lib/firebase.client.ts root@72.61.98.99:/var/www/cryptorafts/src/lib/firebase.client.ts

# Upload next.config.js
scp next.config.js root@72.61.98.99:/var/www/cryptorafts/next.config.js
```

### Step 2: SSH into VPS and run deployment

```bash
ssh root@72.61.98.99
cd /var/www/cryptorafts

# Create .env.local (same as Step 3 above)
# Rebuild (same as Step 4 above)
# Restart PM2 (same as Step 5 above)
# Reload nginx (same as Step 6 above)
```

## Option 3: Use the Deployment Script

I've created a script `COMPLETE_DEPLOY_SCRIPT.sh` that you can upload and run:

```bash
# Upload the script
scp COMPLETE_DEPLOY_SCRIPT.sh root@72.61.98.99:/root/deploy.sh

# SSH into VPS
ssh root@72.61.98.99

# Run the script
chmod +x /root/deploy.sh
/root/deploy.sh
```

## What This Fixes

1. ✅ **Missing Firebase Environment Variables** - Creates `.env.local` with all Firebase config
2. ✅ **Firebase Connection Issues** - Ensures Firebase initializes correctly
3. ✅ **Component Errors** - Uploads fixed components
4. ✅ **Build Issues** - Rebuilds the application
5. ✅ **Service Restart** - Restarts PM2 and nginx

## After Deployment

1. **Clear Browser Cache**
   - Press `Ctrl+Shift+R` (hard refresh)
   - Or open in Incognito/Private mode

2. **Check Browser Console (F12)**
   - Look for Firebase initialization
   - Check for any errors
   - Verify components are loading

3. **Verify Homepage**
   - Should show logo and header ✅
   - Should show hero section with video ✅
   - Should show "WELCOME TO CRYPTORAFTS" ✅
   - Should show "GET STARTED" button ✅
   - Should show all sections ✅

## Troubleshooting

### If app still doesn't work:

1. **Check PM2 logs:**
   ```bash
   pm2 logs cryptorafts --lines 50
   ```

2. **Check nginx logs:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Check if app is running:**
   ```bash
   pm2 status
   curl http://localhost:3000
   ```

4. **Check environment variables:**
   ```bash
   cd /var/www/cryptorafts
   cat .env.local
   ```

5. **Rebuild if needed:**
   ```bash
   cd /var/www/cryptorafts
   npm run build
   pm2 restart cryptorafts
   ```

## Expected Result

After deployment, your homepage at **https://www.cryptorafts.com** should show:

- ✅ Logo and header (already working)
- ✅ Hero section with video background
- ✅ "WELCOME TO CRYPTORAFTS" text
- ✅ "The AI-Powered Web3 Ecosystem" headline
- ✅ "GET STARTED" button
- ✅ Spotlight section
- ✅ Platform features
- ✅ Network statistics
- ✅ Footer

---

**VPS Details:**
- IP: 72.61.98.99
- User: root
- Path: /var/www/cryptorafts
- Domain: https://www.cryptorafts.com
