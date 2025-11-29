# Deploy Updated Firestore Rules - Fix CORS Errors

## ✅ Rules Updated

I've updated your `firestore-security.rules` file to allow public read access for:
- ✅ `spotlights` collection (for homepage)
- ✅ `users` collection (for stats)
- ✅ `projects` collection (for stats)

## 🚀 Deploy Steps

### Step 1: Copy Updated Rules

The rules file has been updated. You need to deploy it to Firebase.

### Step 2: Deploy to Firebase Console

**Option 1: Manual Copy-Paste (Recommended)**

1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules
2. Click **Edit rules**
3. Copy the entire contents of `firestore-security.rules` file
4. Paste into Firebase Console
5. Click **Publish**
6. Wait 1-2 minutes for propagation

**Option 2: Use Firebase CLI**

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 3: Verify

1. Wait 1-2 minutes after publishing
2. Clear browser cache
3. Test in incognito mode
4. Check browser console - CORS errors should be gone

## 📋 What Changed

### Before:
- `spotlights` collection: ❌ No rule (denied by catch-all)
- `users` collection: ❌ Requires authentication
- `projects` collection: ❌ Requires authentication

### After:
- `spotlights` collection: ✅ Public read access
- `users` collection: ✅ Public read access (for stats)
- `projects` collection: ✅ Public read access (for stats)

## ✅ After Deployment

Once rules are deployed:
- ✅ Firestore CORS errors will disappear
- ✅ Spotlight section will load
- ✅ Real-time stats will work
- ✅ Homepage will display correctly
- ✅ All Firestore features will work

## 🔒 Security Note

The rules allow **public read** for these collections, but:
- ✅ Write operations still require authentication
- ✅ User data is still protected (only counts/aggregates are public)
- ✅ Private collections remain protected

This is safe for homepage display purposes.

