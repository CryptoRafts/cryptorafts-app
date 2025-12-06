# Automated On-Chain Storage After Approval

## ✅ Implementation Complete

### What Happens After Admin/Department Approval

#### KYC Approval Flow:
1. **Admin approves KYC** in admin panel
2. **System automatically:**
   - Hashes and salts each document separately:
     - Front ID card
     - Back ID card
     - Proof of address
     - Live snap/selfie
   - Stores all 4 hashes on BNB Smart Chain
   - Deletes raw document URLs from Firebase
   - Keeps only hashes and metadata

#### KYB Approval Flow:
1. **Admin approves KYB** in admin panel
2. **System automatically:**
   - Hashes and salts phone number
   - Hashes and salts email address
   - Stores both hashes on BNB Smart Chain
   - Deletes raw phone/email from Firebase
   - Keeps only hashes and metadata

---

## 🔧 API Routes Created

### 1. `/api/kyc/store-on-chain` (POST)
**Purpose**: Automatically store KYC data on-chain after approval

**Request:**
```json
{
  "userId": "user-id-here",
  "approvalStatus": true
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "hashes": {
    "frontId": { "hash": "...", "salt": "..." },
    "backId": { "hash": "...", "salt": "..." },
    "proofOfAddress": { "hash": "...", "salt": "..." },
    "liveSnap": { "hash": "...", "salt": "..." }
  },
  "explorerUrl": "https://bscscan.com/tx/0x...",
  "message": "KYC data stored on BNB Chain successfully. Raw data deleted from backend."
}
```

### 2. `/api/kyb/store-on-chain` (POST)
**Purpose**: Automatically store KYB data on-chain after approval

**Request:**
```json
{
  "userId": "user-id-here",
  "orgId": "org-id-here", // Optional, for organization KYB
  "approvalStatus": true
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "hashes": {
    "phone": { "hash": "...", "salt": "..." },
    "email": { "hash": "...", "salt": "..." }
  },
  "explorerUrl": "https://bscscan.com/tx/0x...",
  "message": "KYB data stored on BNB Chain successfully. Raw data deleted from backend."
}
```

---

## 🔄 Integration Points

### KYC Approval (`src/app/admin/kyc/page.tsx`)
- ✅ Updated `handleApproveKYC()` function
- ✅ Automatically calls `/api/kyc/store-on-chain` after approval
- ✅ Updates document with transaction hash
- ✅ Shows success message with explorer link

### KYB Approval (To be updated)
- ⏳ Need to update KYB approval function
- ⏳ Will automatically call `/api/kyb/store-on-chain` after approval

---

## 🔐 Data Deletion Process

### After On-Chain Storage:

**KYC Documents:**
- ❌ Deleted: `idFront`, `idBack`, `proofOfAddress`, `selfie` URLs
- ✅ Kept: Status, timestamps, reviewer info, on-chain hashes

**KYB Data:**
- ❌ Deleted: `phone`, `phoneNumber`, `email`, `contactEmail`
- ✅ Kept: Organization info, status, timestamps, on-chain hashes

**Metadata Preserved:**
- Approval status
- Review timestamps
- Reviewer information
- On-chain transaction hash
- Hash values and salts (for verification)

---

## ⚙️ Environment Variables Required

```bash
# Admin wallet for signing on-chain transactions
ADMIN_WALLET_PRIVATE_KEY=your_private_key_here

# Firebase Admin credentials
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Contract addresses (after deployment)
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
```

---

## 🧪 Testing

### Test KYC Approval:
1. Submit KYC documents as user
2. Admin approves KYC
3. Check console for on-chain storage logs
4. Verify transaction on BSCScan
5. Check Firebase - raw documents should be deleted
6. Verify hashes are stored in `onChainHash` field

### Test KYB Approval:
1. Submit KYB data (phone, email) as VC/influencer
2. Admin approves KYB
3. Check console for on-chain storage logs
4. Verify transaction on BSCScan
5. Check Firebase - raw phone/email should be deleted
6. Verify hashes are stored in `onChainHash` field

---

## 📋 Process Flow

### KYC Approval → On-Chain Storage:
```
Admin clicks "Approve KYC"
    ↓
Update status to "approved" in Firebase
    ↓
Call /api/kyc/store-on-chain
    ↓
Fetch KYC documents from Firebase
    ↓
Hash & salt each document (Front ID, Back ID, Proof, Selfie)
    ↓
Store 4 hashes on BNB Chain
    ↓
Delete raw document URLs from Firebase
    ↓
Save transaction hash and hashes to Firebase
    ↓
Return success with explorer link
```

### KYB Approval → On-Chain Storage:
```
Admin clicks "Approve KYB"
    ↓
Update status to "approved" in Firebase
    ↓
Call /api/kyb/store-on-chain
    ↓
Fetch KYB data (phone, email) from Firebase
    ↓
Hash & salt phone and email separately
    ↓
Store 2 hashes on BNB Chain
    ↓
Delete raw phone/email from Firebase
    ↓
Save transaction hash and hashes to Firebase
    ↓
Return success with explorer link
```

---

## ✅ Status

- ✅ KYC store-on-chain API updated with new contract structure
- ✅ KYB store-on-chain API created
- ✅ KYC approval integrated with on-chain storage
- ⏳ KYB approval integration (needs update)
- ✅ Raw data deletion after on-chain storage
- ✅ Transaction hash saved to Firebase

---

**Next Step**: Update KYB approval function to call the API automatically


