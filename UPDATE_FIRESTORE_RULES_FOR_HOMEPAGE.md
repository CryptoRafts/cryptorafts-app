# Fix Firestore CORS - Update Security Rules for Homepage

## 🔍 Problem

Domain is already in Firebase, but you're getting **403 Forbidden** errors because:
- Homepage tries to read `spotlights` collection **without authentication**
- Homepage tries to read `users` collection **without authentication** (for stats)
- Current Firestore rules require `request.auth != null` for most operations

## ✅ Solution: Add Public Read Access for Homepage Collections

### Step 1: Go to Firestore Rules

1. Open: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules
2. Click **Edit rules**

### Step 2: Add Public Read Rules

Add these rules **at the top** of your rules (before other rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==================== PUBLIC READ ACCESS (HOMEPAGE) ====================
    
    // Spotlight collection - public read for homepage
    match /spotlights/{spotlightId} {
      allow read: if true;  // Public read access
      allow write: if request.auth != null;  // Authenticated write only
    }
    
    // Users collection - public read for stats (only count, not full data)
    match /users/{userId} {
      allow read: if true;  // Public read for homepage stats
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects collection - public read for homepage stats
    match /projects/{projectId} {
      allow read: if true;  // Public read for homepage stats
      allow write: if request.auth != null;
    }
    
    // ==================== EXISTING RULES (KEEP YOUR EXISTING RULES BELOW) ====================
    
    // ... your existing rules here ...
    
  }
}
```

### Step 3: Publish Rules

1. Click **Publish** button
2. Wait 1-2 minutes for propagation
3. Clear browser cache
4. Test again

## 🔒 Alternative: More Secure Rules

If you want to keep data more private, you can use this instead:

```javascript
// Spotlight - public read, authenticated write
match /spotlights/{spotlightId} {
  allow read: if true;
  allow write: if request.auth != null;
}

// Users - only read count, not full data
match /users/{userId} {
  // Only allow reading if it's for stats (count queries)
  allow read: if request.query.limit != null && request.query.limit <= 1000;
  allow write: if request.auth != null && request.auth.uid == userId;
}

// Projects - public read for stats
match /projects/{projectId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

## 📋 Quick Fix (Temporary - For Testing)

If you want to test quickly, you can temporarily allow all reads:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporary: Allow all reads for testing
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**⚠️ Warning:** This is less secure. Use only for testing, then tighten the rules.

## ✅ After Fix

Once rules are updated:
- ✅ Firestore CORS errors will disappear
- ✅ Spotlight section will load
- ✅ Real-time stats will work
- ✅ Homepage will display correctly

## 🔍 Verify Rules

After publishing, verify:
1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules
2. Check that rules are published
3. Test in browser console - errors should be gone

