# Firebase Storage Troubleshooting

## Current Issue
KYC document uploads are still failing with 403 errors despite multiple rule updates.

## Possible Root Causes

### 1. Storage Bucket Configuration Issue
The error URL shows: `cryptorafts-b9067.appspot.com`
But the actual bucket might be different.

### 2. Authentication State Issue
The user might not be properly authenticated when the upload is attempted.

### 3. Firebase Project Configuration Mismatch
The environment variables might not match the actual Firebase project.

## Debugging Steps

### Step 1: Check Authentication Status
Add this to your browser console:
```javascript
import { auth } from './src/lib/firebase.client';
console.log('Auth state:', auth.currentUser);
console.log('Auth token:', auth.currentUser?.accessToken);
```

### Step 2: Check Firebase Configuration
Add this to your browser console:
```javascript
console.log('Firebase Config:', {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
});
```

### Step 3: Test Simple Upload
Try this in your browser console:
```javascript
import { storage } from './src/lib/firebase.client';
import { ref, uploadBytes } from 'firebase/storage';

const testRef = ref(storage, 'kyc-documents/test.txt');
const testBlob = new Blob(['test'], { type: 'text/plain' });
uploadBytes(testRef, testBlob).then(() => {
  console.log('Upload successful');
}).catch((error) => {
  console.error('Upload failed:', error);
});
```

## Current Storage Rules (Simplified)
```javascript
// KYC documents - allow all authenticated users
match /kyc-documents/{allPaths=**} {
  allow read, write: if request.auth != null;
}
```

## Manual Fix Options

### Option 1: Check Firebase Console
1. Go to Firebase Console > Storage
2. Verify the bucket name matches: `cryptorafts-b9067.appspot.com`
3. Check if storage is enabled
4. Verify rules are deployed

### Option 2: Check Environment Variables
Verify your `.env.local` file has:
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.appspot.com
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
```

### Option 3: Temporary Public Access (Testing Only)
```javascript
// TEMPORARY - for testing only
match /kyc-documents/{allPaths=**} {
  allow read, write: if true;
}
```

### Option 4: Check Upload Function
The upload function in KYCVerification.tsx might have an issue:
```javascript
const storageRef = ref(storage, `kyc-documents/${type}-${Date.now()}-${file.name}`);
```

## Next Steps

1. **Try the upload again** with the simplified rules
2. **Check browser console** for authentication status
3. **Verify Firebase configuration** in environment variables
4. **Check Firebase Console** for storage bucket status
5. **Test with a simple file** to isolate the issue

## If Still Failing

The issue might be:
- Storage bucket not properly configured
- Authentication token expired
- CORS issues
- Firebase project configuration mismatch

Try the debugging steps above to identify the exact cause.
