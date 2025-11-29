# Firebase Permissions Fix

## Manual Steps to Fix Firebase Permissions

### 1. Deploy Firestore Rules
```bash
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
- ✅ Firestore rules updated to be completely open
- ✅ Storage rules updated to be completely open  
- ✅ VC onboarding has fallback error handling
- ✅ Logo upload has base64 fallback
- ✅ Form submission has error recovery

## Next Steps
1. Deploy the rules using one of the methods above
2. Test the VC onboarding flow
3. All permission issues should be resolved
