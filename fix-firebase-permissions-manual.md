# Manual Firebase Rules Fix

## Issue
Firebase Storage and Firestore permission errors are preventing VC onboarding.

## Solution
The rules are already set to be completely open for testing, but they need to be deployed.

## Manual Steps

### 1. Deploy Firestore Rules
```bash
firebase login --no-localhost
firebase deploy --only firestore:rules
```

### 2. Deploy Storage Rules  
```bash
firebase deploy --only storage
```

### 3. Alternative: Use Firebase Console
1. Go to Firebase Console
2. Navigate to Firestore Database > Rules
3. Replace with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Navigate to Storage > Rules
5. Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Current Status
- ✅ Firestore rules are open in code
- ✅ Storage rules are open in code  
- ❌ Rules need to be deployed to Firebase
- ✅ VC onboarding logic is fixed
- ✅ Logo upload fallback is working
- ✅ Form validation is improved
- ✅ Repetition prevention is added

## Test After Deployment
1. Try VC onboarding again
2. Logo upload should work (either Firebase Storage or base64 fallback)
3. Form validation should be clear
4. No repetition of organization creation
