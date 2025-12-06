# Approval to On-Chain Storage Flow

## ✅ Complete Implementation

### What Happens After Admin/Department Approval

---

## 🔐 KYC Approval Flow

### Step-by-Step Process:

1. **Admin Reviews KYC Documents**
   - Views: Front ID, Back ID, Proof of Address, Live Snap
   - Reviews in admin panel (`/admin/kyc`)

2. **Admin Clicks "Approve"**
   - Status updated to `approved` in Firebase
   - User document updated with approval status

3. **Automatic On-Chain Storage** (NEW)
   - System calls `/api/kyc/store-on-chain`
   - Fetches KYC documents from Firebase
   - **Hashes & salts each document separately:**
     - Front ID card → `frontIdHash`
     - Back ID card → `backIdHash`
     - Proof of address → `proofOfAddressHash`
     - Live snap → `liveSnapHash`
   - Stores all 4 hashes on BNB Smart Chain
   - Transaction hash saved to Firebase

4. **Raw Data Deletion**
   - Document URLs deleted from `kyc_documents` collection
   - Only hashes and metadata kept
   - Raw images removed from storage

5. **Confirmation**
   - Success message with BSCScan link
   - Transaction hash visible in admin panel

---

## 🏢 KYB Approval Flow

### Step-by-Step Process:

1. **Admin Reviews KYB Data**
   - Views: Phone number, Email, Organization details
   - Reviews in admin panel (`/admin/kyb`)

2. **Admin Clicks "Approve"**
   - Status updated to `approved` in Firebase
   - User/organization document updated

3. **Automatic On-Chain Storage** (NEW)
   - System calls `/api/kyb/store-on-chain`
   - Fetches KYB data from Firebase
   - **Hashes & salts separately:**
     - Phone number → `phoneHash`
     - Email address → `emailHash`
   - Stores both hashes on BNB Smart Chain
   - Transaction hash saved to Firebase

4. **Raw Data Deletion**
   - Phone and email deleted from Firebase
   - Only hashes and metadata kept

5. **Confirmation**
   - Success message with BSCScan link
   - Transaction hash visible in admin panel

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  Admin Approves │
│   KYC/KYB       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Status   │
│ in Firebase     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Call API Route  │
│ /api/kyc/store  │
│ /api/kyb/store  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fetch Documents │
│ from Firebase   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Hash & Salt     │
│ Each Field      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store on        │
│ BNB Chain       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Delete Raw Data │
│ from Firebase   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save TX Hash    │
│ to Firebase     │
└─────────────────┘
```

---

## 🔧 API Integration

### KYC Approval Function
**File**: `src/app/admin/kyc/page.tsx`
**Function**: `handleApproveKYC()`

**Added Code:**
```typescript
// Automatically store on-chain after approval
try {
  const storeResponse = await fetch('/api/kyc/store-on-chain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: docId,
      approvalStatus: true,
    }),
  });
  // Handle response...
} catch (error) {
  // Non-critical - don't fail approval
}
```

### KYB Approval Function
**File**: `src/app/admin/kyb/page.tsx`
**Function**: `handleUpdateStatus()` (when status = 'approved')

**Added Code:**
```typescript
// Automatically store on-chain after approval
if (newStatus === 'approved') {
  try {
    const storeResponse = await fetch('/api/kyb/store-on-chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        orgId: id,
        approvalStatus: true,
      }),
    });
    // Handle response...
  } catch (error) {
    // Non-critical - don't fail approval
  }
}
```

---

## 🔐 Security Features

### Data Protection:
- ✅ Raw data never stored on-chain
- ✅ Only hashed and salted data on-chain
- ✅ Unique salt for each document/field
- ✅ Raw data deleted after on-chain storage
- ✅ Hashes cannot be reversed

### Access Control:
- ✅ Only admin can approve
- ✅ API routes require admin authentication
- ✅ Admin wallet private key in environment
- ✅ Transaction signed by admin wallet

---

## 📝 What Gets Stored

### On-Chain (BNB Smart Chain):
- ✅ Front ID Hash (bytes32)
- ✅ Back ID Hash (bytes32)
- ✅ Proof of Address Hash (bytes32)
- ✅ Live Snap Hash (bytes32)
- ✅ Phone Hash (bytes32) - KYB only
- ✅ Email Hash (bytes32) - KYB only
- ✅ Approval status
- ✅ Timestamp
- ✅ Admin address

### In Firebase (After Storage):
- ✅ Approval status
- ✅ Review timestamps
- ✅ Reviewer information
- ✅ Transaction hash
- ✅ On-chain hash values
- ✅ Salts (for verification)
- ❌ Raw document URLs (deleted)
- ❌ Raw phone/email (deleted)

---

## 🧪 Testing Checklist

### KYC Approval Test:
- [ ] Submit KYC documents as user
- [ ] Admin approves KYC
- [ ] Check console for on-chain storage logs
- [ ] Verify transaction on BSCScan
- [ ] Check Firebase - documents deleted
- [ ] Verify hashes in `onChainHash` field
- [ ] Verify transaction hash saved

### KYB Approval Test:
- [ ] Submit KYB data as VC/influencer
- [ ] Admin approves KYB
- [ ] Check console for on-chain storage logs
- [ ] Verify transaction on BSCScan
- [ ] Check Firebase - phone/email deleted
- [ ] Verify hashes in `onChainHash` field
- [ ] Verify transaction hash saved

---

## ⚙️ Configuration

### Required Environment Variables:
```bash
# Admin wallet for signing transactions
ADMIN_WALLET_PRIVATE_KEY=your_private_key

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Contract addresses (after deployment)
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
```

---

## ✅ Status

- ✅ KYC store-on-chain API updated
- ✅ KYB store-on-chain API created
- ✅ KYC approval integrated
- ✅ KYB approval integrated
- ✅ Raw data deletion implemented
- ✅ Transaction hash saving
- ✅ Error handling (non-critical failures)

---

**Status**: ✅ Complete and ready for testing  
**Next Step**: Deploy contracts to testnet and test the full flow


