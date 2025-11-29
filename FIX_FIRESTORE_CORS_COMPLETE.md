# Fix Firestore CORS Error - Domain Already Added

## 🔍 Problem

Domain `www.cryptorafts.com` is already in Firebase authorized domains, but you're still getting CORS errors:

```
Access to fetch at 'https://firestore.googleapis.com/...' from origin 'https://www.cryptorafts.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

POST https://firestore.googleapis.com/... net::ERR_FAILED 403 (Forbidden)
```

## ✅ Possible Causes & Fixes

### 1. Check Firestore Security Rules

The CORS error might actually be a **Firestore security rules** issue, not a domain authorization issue.

**Fix:**
1. Go to Firebase Console: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules
2. Check your Firestore security rules
3. Make sure they allow read access for the collections you're trying to access

**Example Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to spotlights
    match /spotlights/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow read access to users
    match /users/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow read access to projects
    match /projects/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 2. Check Firebase Project Settings

Make sure the domain is added in **both** places:

**Authentication Settings:**
1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
2. Check "Authorized domains" section
3. Verify `www.cryptorafts.com` and `cryptorafts.com` are listed

**Firebase Hosting (if using):**
1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/hosting
2. Check if domain needs to be added here too

### 3. Check Firebase API Key Restrictions

The API key might have domain restrictions:

1. Go to: https://console.cloud.google.com/apis/credentials?project=cryptorafts-b9067
2. Find your API key: `AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14`
3. Click on it
4. Check "Application restrictions"
5. If it's set to "HTTP referrers", make sure `www.cryptorafts.com` is in the list
6. If it's set to "None", that's fine

### 4. Clear Browser Cache

After adding domains, clear browser cache:
1. Press `F12` (DevTools)
2. Go to Application tab
3. Click "Clear storage"
4. Check all boxes
5. Click "Clear site data"
6. Hard refresh: `Ctrl + Shift + R`

### 5. Wait for Propagation

Firebase changes can take 5-10 minutes to propagate:
- Wait 10 minutes after adding domain
- Clear browser cache
- Test in incognito mode

### 6. Check Firestore Indexes

Some queries might need indexes:
1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/indexes
2. Check if there are any missing indexes
3. Create them if needed

### 7. Verify Firebase Config

Make sure your Firebase config on VPS matches your Firebase project:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14",
  authDomain: "cryptorafts-b9067.firebaseapp.com",
  projectId: "cryptorafts-b9067",
  storageBucket: "cryptorafts-b9067.firebasestorage.app",
  messagingSenderId: "374711838796",
  appId: "1:374711838796:web:3bee725bfa7d8790456ce9"
};
```

## 🔍 Diagnostic Steps

### Step 1: Check Firestore Rules
```bash
# Go to Firebase Console
https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules
```

### Step 2: Check Authorized Domains
```bash
# Go to Firebase Console
https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
```

### Step 3: Check API Key Restrictions
```bash
# Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials?project=cryptorafts-b9067
```

### Step 4: Test in Incognito Mode
- Press `Ctrl + Shift + N`
- Visit `https://www.cryptorafts.com/`
- Check if errors persist

## 📋 Most Likely Fix

**The issue is probably Firestore security rules, not domain authorization.**

1. Go to Firestore Rules: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules
2. Make sure rules allow read access for:
   - `spotlights` collection
   - `users` collection
   - `projects` collection
3. Publish the rules
4. Wait 1-2 minutes
5. Test again

## ✅ After Fix

Once fixed:
- ✅ Firestore real-time listeners will work
- ✅ CORS errors will disappear
- ✅ Spotlight section will load
- ✅ Real-time stats will update
- ✅ All Firestore features will work

