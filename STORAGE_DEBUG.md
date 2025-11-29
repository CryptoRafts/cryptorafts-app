# Firebase Storage Debug Guide

## Current Issue
KYC document uploads are still failing with 403 errors despite updated storage rules.

## Debugging Steps

### 1. Check Firebase Console Storage Settings
Go to Firebase Console > Storage and verify:
- ✅ Storage bucket is enabled
- ✅ Rules are deployed and active
- ✅ Bucket name matches: `cryptorafts-b9067.appspot.com`

### 2. Check Authentication Status
Verify the user is properly authenticated:
```javascript
// In browser console
import { auth } from './src/lib/firebase.client';
console.log('Current user:', auth.currentUser);
console.log('Auth state:', auth.currentUser ? 'authenticated' : 'not authenticated');
```

### 3. Test Storage Rules
Try uploading a simple test file to verify rules are working:
```javascript
// Test upload
import { storage } from './src/lib/firebase.client';
import { ref, uploadBytes } from 'firebase/storage';

const testRef = ref(storage, 'kyc-documents/test-file.txt');
const testBlob = new Blob(['test content'], { type: 'text/plain' });
uploadBytes(testRef, testBlob).then(() => {
  console.log('Upload successful');
}).catch((error) => {
  console.error('Upload failed:', error);
});
```

### 4. Check Environment Variables
Verify Firebase configuration:
```javascript
console.log('Firebase Config:', {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
});
```

### 5. Current Storage Rules
```javascript
// KYC documents - authenticated users can upload
match /kyc-documents/{fileName} {
  allow read, write: if isAuthenticated();
}

// KYC documents with any path structure
match /kyc-documents/{allPaths=**} {
  allow read, write: if isAuthenticated();
}
```

## Potential Issues

### 1. Storage Bucket Not Enabled
- Check Firebase Console > Storage
- Ensure storage is enabled for the project

### 2. Authentication Token Issues
- User might not be properly authenticated
- Token might be expired
- Check auth state in browser

### 3. CORS Issues
- Browser might be blocking the request
- Check browser console for CORS errors

### 4. Firebase Project Configuration
- Verify project ID matches
- Check storage bucket name
- Ensure API keys are correct

## Quick Fix Attempts

### Option 1: Temporarily Allow All Access
```javascript
// TEMPORARY - for testing only
match /kyc-documents/{allPaths=**} {
  allow read, write: if true;
}
```

### Option 2: Check User Authentication
```javascript
// In the upload function, add debugging
console.log('User authenticated:', !!auth.currentUser);
console.log('User ID:', auth.currentUser?.uid);
```

### Option 3: Verify File Path
```javascript
// Check the exact path being used
console.log('Upload path:', `kyc-documents/${type}-${Date.now()}-${file.name}`);
```

## Next Steps

1. **Try the upload again** with the updated rules
2. **Check browser console** for any additional error details
3. **Verify authentication** status
4. **Test with a simple file** to isolate the issue
5. **Check Firebase Console** for any configuration issues

## Files to Check

- `src/lib/firebase.client.ts` - Firebase configuration
- `src/components/KYCVerification.tsx` - Upload logic
- `storage.rules` - Storage security rules
- Environment variables in `.env.local`

The issue might be related to authentication state, storage bucket configuration, or a timing issue with rule deployment.
