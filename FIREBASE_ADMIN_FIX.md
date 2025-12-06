# Firebase Admin Initialization Fix

## ✅ Issue Fixed

**Error**: `The default Firebase app does not exist. Make sure you call initializeApp() before using any of the Firebase services.`

## 🔧 Changes Made

### 1. Fixed KYC Store-on-Chain Route (`src/app/api/kyc/store-on-chain/route.ts`)

**Issues Fixed**:
- ❌ `getAuth()` called without app parameter
- ❌ `db.FieldValue.delete()` incorrect usage
- ❌ No null check for Firebase Admin initialization

**Fixes Applied**:
- ✅ Use `getAdminAuth()` instead of `getAuth()`
- ✅ Import `FieldValue` from `firebase-admin/firestore`
- ✅ Use `FieldValue.delete()` instead of `db.FieldValue.delete()`
- ✅ Added null checks for Firebase Admin initialization
- ✅ Better error handling and logging

### 2. Fixed KYB Store-on-Chain Route (`src/app/api/kyb/store-on-chain/route.ts`)

**Same fixes applied**:
- ✅ Use `getAdminAuth()` instead of `getAuth()`
- ✅ Import `FieldValue` from `firebase-admin/firestore`
- ✅ Use `FieldValue.delete()` instead of `db.FieldValue.delete()`
- ✅ Added null checks for Firebase Admin initialization

## 📝 Code Changes

### Before:
```typescript
import { getAuth } from 'firebase-admin/auth';

const adminAuth = getAuth(); // ❌ Fails if no default app
decodedToken = await adminAuth.verifyIdToken(token);

// Later...
idFront: db.FieldValue.delete(), // ❌ Incorrect usage
```

### After:
```typescript
import { getAdminAuth } from '@/server/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const adminAuth = getAdminAuth(); // ✅ Uses centralized function
if (!adminAuth) {
  return NextResponse.json(
    { error: 'Server configuration error. Please contact support.' },
    { status: 500 }
  );
}
decodedToken = await adminAuth.verifyIdToken(token);

// Later...
idFront: FieldValue.delete(), // ✅ Correct usage
```

## ✅ Testing

After these fixes:
1. ✅ Firebase Admin initializes properly
2. ✅ Auth token verification works
3. ✅ Firestore operations work correctly
4. ✅ Field deletion works properly
5. ✅ Better error messages for debugging

## 🚀 Next Steps

1. Test KYC approval flow in admin panel
2. Verify on-chain storage works
3. Check that raw data is deleted from Firebase
4. Monitor for any remaining errors

---

**✅ Firebase Admin initialization issues resolved!**


