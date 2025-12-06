# FieldValue.delete() Fix

## ✅ Issue Fixed

**Error**: `Cannot read properties of undefined (reading 'keyGenerator')`

## 🔧 Root Cause

The `FieldValue` was being imported directly from `firebase-admin/firestore`, but in Firebase Admin SDK, `FieldValue` needs to be accessed through the initialized `admin` namespace.

## 📝 Solution

Changed from:
```typescript
import { FieldValue } from 'firebase-admin/firestore';
// ...
idFront: FieldValue.delete(), // ❌ Fails with keyGenerator error
```

To:
```typescript
import admin from 'firebase-admin';
// ...
await initAdmin(); // Ensure admin is initialized
idFront: admin.firestore.FieldValue.delete(), // ✅ Works correctly
```

## ✅ Files Fixed

1. **`src/app/api/kyc/store-on-chain/route.ts`**
   - Changed to use `admin.firestore.FieldValue.delete()`
   - Added `initAdmin()` call before using FieldValue

2. **`src/app/api/kyb/store-on-chain/route.ts`**
   - Same fix applied

## 🧪 Testing

After this fix:
1. ✅ FieldValue.delete() works correctly
2. ✅ No more keyGenerator errors
3. ✅ Document fields are properly deleted from Firestore

---

**✅ FieldValue.delete() issue resolved!**


