# Fix for "keyGenerator" Error in KYC/KYB On-Chain Storage

## Problem
After fixing the `FieldValue.delete()` issue, a new error appeared:
```
Failed to store KYC on-chain: {
  error: 'Failed to store KYC on BNB Chain',
  details: "Cannot read properties of undefined (reading 'keyGenerator')"
}
```

## Root Cause
The "keyGenerator" error is a Firebase Admin SDK internal error that can occur when:
1. **Invalid data types**: Using JavaScript `Date` objects instead of Firestore `Timestamp` objects
2. **Uninitialized Firestore instance**: The Firestore instance might not be fully ready when accessed
3. **Data serialization issues**: Invalid data structures being passed to Firestore

## Solution
### 1. Use Firestore Timestamp Instead of JavaScript Date
Changed `new Date()` to `Timestamp.now()` for all timestamp fields in the update data:

```typescript
// Before
storedAt: new Date(),
updatedAt: new Date(),

// After
import { Timestamp } from 'firebase-admin/firestore';
storedAt: Timestamp.now(),
updatedAt: Timestamp.now(),
```

### 2. Added Firestore Instance Validation
Added validation to ensure the Firestore instance is properly initialized and valid before use:

```typescript
// Verify db is a valid Firestore instance
if (typeof db.collection !== 'function') {
  console.error('❌ Invalid Firestore instance');
  return NextResponse.json(
    { error: 'Server configuration error. Invalid database instance.' },
    { status: 500 }
  );
}
```

### 3. Ensured Proper Initialization
Removed unnecessary `await` on `getAdminDb()` since it's synchronous, and ensured `getAdminDb()` handles initialization internally.

## Files Modified
1. `src/app/api/kyc/store-on-chain/route.ts`
   - Added `Timestamp` import from `firebase-admin/firestore`
   - Changed `new Date()` to `Timestamp.now()` for `storedAt` and `updatedAt`
   - Added Firestore instance validation
   - Fixed initialization flow

2. `src/app/api/kyb/store-on-chain/route.ts`
   - Added `Timestamp` import from `firebase-admin/firestore`
   - Changed `new Date()` to `Timestamp.now()` for `storedAt` and `updatedAt`
   - Added Firestore instance validation
   - Fixed initialization flow

## Testing
After these changes, the KYC/KYB on-chain storage should work without the "keyGenerator" error. The update operations will use proper Firestore types and ensure the database instance is valid before performing operations.

## Related Issues
- Previous fix: `FieldValue.delete()` compatibility issue (see `FIELDVALUE_FIX.md`)
- Firebase Admin SDK version: `^13.5.0`

## Notes
- `Timestamp.now()` is the correct way to create Firestore timestamps in the Admin SDK
- `FieldValue.serverTimestamp()` can also be used, but `Timestamp.now()` is more explicit
- The validation check ensures we catch initialization issues early
- All sensitive data is still set to `null` (not deleted) to avoid `FieldValue.delete()` issues


