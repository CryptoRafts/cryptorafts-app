# 🔧 Manual Fix Steps for Firestore CORS Issue

Since the domains are already authorized in Firebase Console, the issue is likely with **API Key restrictions** or **Firestore security rules**.

## Step 1: Upload Fixed Component

Run these commands in PowerShell (one at a time, enter password when prompted):

```powershell
scp src/components/SpotlightDisplay.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/SpotlightDisplay.tsx
```

## Step 2: Upload Diagnostic Script

```powershell
scp DIAGNOSE_FIRESTORE_COMPLETE.sh root@72.61.98.99:/root/DIAGNOSE_FIRESTORE_COMPLETE.sh
```

## Step 3: Rebuild and Restart on VPS

SSH into VPS and run:

```bash
ssh root@72.61.98.99
cd /var/www/cryptorafts
npm run build
pm2 restart cryptorafts
chmod +x /root/DIAGNOSE_FIRESTORE_COMPLETE.sh
/root/DIAGNOSE_FIRESTORE_COMPLETE.sh
```

## Step 4: Check API Key Restrictions

The most likely issue is **API Key restrictions** in Google Cloud Console:

1. **Go to:** https://console.cloud.google.com/apis/credentials?project=cryptorafts-b9067

2. **Find your API key:** `AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14`

3. **Click on the API key** to edit it

4. **Check "Application restrictions":**
   - If it's set to **"HTTP referrers (web sites)"**, you need to add:
     - `https://www.cryptorafts.com/*`
     - `https://cryptorafts.com/*`
   - If it's set to **"None"**, that's fine
   - If it's set to **"IP addresses"**, change it to **"HTTP referrers"** and add the domains above

5. **Save changes**

6. **Wait 1-2 minutes** for changes to propagate

## Step 5: Verify Firestore Security Rules

1. **Go to:** https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules

2. **Verify the `spotlights` collection has:**
   ```javascript
   match /spotlights/{spotlightId} {
     allow read: if true;  // Public read
     allow write: if isAdmin();
   }
   ```

3. **If it doesn't, update it and click "Publish"**

## Step 6: Test in Browser

1. **Open:** https://www.cryptorafts.com
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Look for errors:**
   - If you see CORS errors, check API key restrictions (Step 4)
   - If you see 403 Forbidden, check Firestore rules (Step 5)
   - If you see other errors, note them down

## Step 7: Test Firestore Directly

In the browser console (F12 > Console), run:

```javascript
fetch('https://firestore.googleapis.com/v1/projects/cryptorafts-b9067/databases/(default)/documents/spotlights?pageSize=1')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected results:**
- ✅ **200 OK**: Should return JSON with spotlights data
- ❌ **403 Forbidden**: API key restrictions issue (fix in Step 4)
- ❌ **CORS error**: Domain not authorized (but you said it's already there, so check API key)

## Common Issues and Fixes

### Issue: API Key has HTTP Referrer Restrictions
**Fix:** Add `https://www.cryptorafts.com/*` and `https://cryptorafts.com/*` to the allowed referrers list.

### Issue: Firestore Rules Block Public Read
**Fix:** Ensure `spotlights` collection has `allow read: if true;` in Firestore rules.

### Issue: Network/Firewall Blocking
**Fix:** Check if VPS can reach Firebase APIs:
```bash
curl -I https://firestore.googleapis.com/v1/projects/cryptorafts-b9067/databases
```

### Issue: Firebase Not Initialized
**Fix:** Check browser console for initialization errors. The fixed `SpotlightDisplay.tsx` now has better error handling.

## Quick Test Commands

After making changes, test from VPS:

```bash
# Test Firebase API connectivity
curl -I "https://firestore.googleapis.com/v1/projects/cryptorafts-b9067/databases"

# Check PM2 logs
pm2 logs cryptorafts --lines 50

# Check app response
curl -I http://localhost:3000
```

## Still Not Working?

If the issue persists after checking API key restrictions and Firestore rules:

1. **Check browser console** for the exact error message
2. **Check PM2 logs** on VPS: `pm2 logs cryptorafts`
3. **Share the error message** and I can help diagnose further

