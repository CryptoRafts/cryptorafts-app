# Fix Firebase CORS Error - 403 Forbidden

## 🔍 Problem Identified

Your browser console shows:
```
Access to fetch at 'https://firestore.googleapis.com/...' from origin 'https://www.cryptorafts.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

POST https://firestore.googleapis.com/... net::ERR_FAILED 403 (Forbidden)
```

## ✅ Root Cause

Firebase/Firestore is blocking requests from `https://www.cryptorafts.com` because the domain is not in the authorized domains list.

## 🛠️ Solution: Add Domain to Firebase Console

### Step 1: Go to Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select your project: `cryptorafts-b9067`
3. Click on the **Settings** gear icon (⚙️)
4. Select **Project settings**

### Step 2: Add Authorized Domain

1. Scroll down to **Authorized domains** section
2. Click **Add domain**
3. Add: `www.cryptorafts.com`
4. Click **Add**
5. Also add: `cryptorafts.com` (without www)
6. Click **Add**

### Step 3: Verify Domains

Your authorized domains should include:
- ✅ `localhost` (for development)
- ✅ `cryptorafts.com`
- ✅ `www.cryptorafts.com`
- ✅ `72.61.98.99` (if you need IP access)

### Step 4: Wait for Propagation

- Changes may take a few minutes to propagate
- Clear browser cache after adding domains
- Test in incognito mode

## 📋 Alternative: Check Firebase Config

If you're using Firebase SDK, make sure your config includes the correct project:

```javascript
const firebaseConfig = {
  projectId: 'cryptorafts-b9067',
  // ... other config
};
```

## ✅ After Fix

Once the domain is authorized:
- ✅ Firestore real-time listeners will work
- ✅ CORS errors will disappear
- ✅ Real-time data will load correctly
- ✅ Spotlight and stats will update in real-time

## 🔍 Current Status

**Good News:**
- ✅ App is loading correctly
- ✅ Video is playing
- ✅ Components are initializing
- ✅ UI is rendering

**Issue:**
- ⚠️ Firestore real-time data is blocked by CORS
- ⚠️ This affects SpotlightDisplay and RealtimeStats components
- ⚠️ But the main UI should still be visible

## 📝 Note

The CORS errors are for **real-time Firestore listeners**. The app will still work, but:
- Spotlight section may be empty
- Real-time stats may not update
- Other Firestore-dependent features may not work

The main homepage UI should still be visible even with these errors.
