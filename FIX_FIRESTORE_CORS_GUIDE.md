# 🔧 Fix Firestore CORS/403 Errors

## 🚨 Problem

Your app is showing CORS errors when trying to access Firestore:
```
Access to fetch at 'https://firestore.googleapis.com/...' from origin 'https://www.cryptorafts.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
net::ERR_FAILED 403 (Forbidden)
```

## ✅ Solution

The issue is that `www.cryptorafts.com` is not authorized in Firebase Console. Firebase requires you to explicitly authorize domains that can access your Firebase services.

### Step 1: Add Domain to Firebase Console

1. **Go to Firebase Console:**
   - Open: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings

2. **Scroll to "Authorized domains" section**

3. **Add the following domains:**
   - `www.cryptorafts.com`
   - `cryptorafts.com` (if not already there)
   - `localhost` (for local development - should already be there)

4. **Click "Add domain"** for each one

5. **Save changes**

### Step 2: Wait for Propagation

- Firebase changes can take 1-2 minutes to propagate
- Wait 2 minutes after adding the domain

### Step 3: Clear Browser Cache

- Clear your browser cache or do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- This ensures the browser uses the new Firebase configuration

### Step 4: Test

- Refresh your browser at https://www.cryptorafts.com
- Check the browser console - CORS errors should be gone
- The app should now load spotlights correctly

## 🔍 Verification

After adding the domain, you can verify it's working by:

1. **Check browser console:**
   - No more CORS errors
   - Firestore queries succeed

2. **Check PM2 logs:**
   ```bash
   ssh root@72.61.98.99
   pm2 logs cryptorafts
   ```
   - Should see successful Firestore connections

3. **Test Firestore directly:**
   - The app should load spotlights without errors
   - No "Loading..." stuck state

## 📝 Additional Notes

### Why This Happens

Firebase requires explicit domain authorization for security. When you deploy to a new domain, you must add it to the authorized domains list in Firebase Console.

### Firestore Security Rules

The Firestore security rules already allow public read access to the `spotlights` collection:
```javascript
match /spotlights/{spotlightId} {
  allow read: if true;  // Public read
  allow write: if isAdmin();
}
```

So the issue is not with security rules, but with domain authorization.

### API Key Restrictions

If you have API key restrictions enabled in Google Cloud Console, make sure:
- The API key allows requests from `www.cryptorafts.com`
- HTTP referrer restrictions include your domain

## 🚀 Quick Fix Script

Run this PowerShell script to deploy the fixes:

```powershell
.\DEPLOY_FIRESTORE_FIX.ps1
```

This will:
1. Upload the fixed SpotlightDisplay component
2. Upload the diagnostic script
3. Rebuild the app
4. Restart PM2

## 📞 Still Having Issues?

If CORS errors persist after adding the domain:

1. **Check Firebase Console:**
   - Verify the domain is actually saved
   - Check for typos in the domain name

2. **Check API Key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your Firebase API key
   - Check if there are HTTP referrer restrictions
   - Add `https://www.cryptorafts.com/*` if needed

3. **Check Firestore Rules:**
   - Go to: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules
   - Verify `spotlights` collection has `allow read: if true;`

4. **Check Network:**
   - Ensure the VPS can reach Firebase APIs
   - Check firewall rules

5. **Check Browser Console:**
   - Look for specific error messages
   - Check if it's a different error (not CORS)

## ✅ Success Indicators

When everything is working:
- ✅ No CORS errors in browser console
- ✅ Spotlights load on homepage
- ✅ No "Loading..." stuck state
- ✅ Firestore queries succeed
- ✅ App is fully functional

