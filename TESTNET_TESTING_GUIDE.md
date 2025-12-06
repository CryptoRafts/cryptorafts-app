# BNB Chain Testnet Testing Guide

## 🧪 Complete Testnet Testing Before Mainnet Deployment

This guide ensures all functionality is thoroughly tested on BSC Testnet before deploying to mainnet.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] BSC Testnet RPC configured
- [ ] Testnet BNB obtained from faucet
- [ ] Deployer wallet funded with testnet BNB
- [ ] Environment variables set for testnet

### 2. Contract Deployment
- [ ] Deploy KYCVerification to testnet
- [ ] Deploy KYBVerification to testnet
- [ ] Deploy ProjectRegistry to testnet
- [ ] Verify contracts on BSCScan Testnet
- [ ] Save testnet contract addresses

---

## 🚀 Step 1: Deploy to BSC Testnet

### Get Testnet BNB

1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Enter your wallet address
3. Request testnet BNB (you'll need ~0.1 BNB for testing)

### Deploy Contracts

```bash
# Set testnet environment
export NETWORK=bscTestnet
export BNB_CHAIN_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Deploy to testnet
npx hardhat run scripts/deploy-to-bnb.js --network bscTestnet
```

### Save Testnet Addresses

After deployment, save the addresses to `.env.testnet`:

```env
# BSC Testnet Contract Addresses
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x...

# BSC Testnet RPC
NEXT_PUBLIC_BNB_CHAIN_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Testnet Admin Wallet
ADMIN_WALLET_PRIVATE_KEY=your_testnet_admin_wallet_key
```

---

## ✅ Step 2: Complete Testing Checklist

### A. KYC Contract Testing

#### Test 1: Store KYC Data
- [ ] **Action**: Call `storeKYCVerification()` with test data
- [ ] **Expected**: Transaction succeeds, `KYCStored` event emitted
- [ ] **Verify**: Check transaction on BSCScan Testnet
- [ ] **Verify**: Call `getKYCVerification()` - returns correct hashes
- [ ] **Verify**: Call `checkKYCStatus()` - returns `exists: true, approved: true, deleted: false`

**Test Script**:
```javascript
const kycContract = await ethers.getContractAt("KYCVerification", kycAddress);
const tx = await kycContract.storeKYCVerification(
  "test-user-123",
  "0x" + "a".repeat(64), // frontIdHash
  "0x" + "b".repeat(64), // backIdHash
  "0x" + "c".repeat(64), // proofHash
  "0x" + "d".repeat(64), // liveSnapHash
  true // approved
);
await tx.wait();
console.log("✅ KYC stored:", tx.hash);
```

#### Test 2: Delete KYC Data
- [ ] **Action**: Call `deleteKYCVerification()` for the test user
- [ ] **Expected**: Transaction succeeds, `KYCDeleted` event emitted
- [ ] **Verify**: Call `getKYCVerification()` - returns zero hashes
- [ ] **Verify**: Call `checkKYCStatus()` - returns `exists: true, approved: true, deleted: true`

**Test Script**:
```javascript
const deleteTx = await kycContract.deleteKYCVerification("test-user-123");
await deleteTx.wait();
console.log("✅ KYC deleted:", deleteTx.hash);

// Verify deletion
const [frontId, backId, proof, liveSnap, approved, deleted, timestamp] = 
  await kycContract.getKYCVerification("test-user-123");
console.log("Deleted:", deleted); // Should be true
console.log("Hashes are zero:", 
  frontId === "0x0000..." && backId === "0x0000..."); // Should be true
```

#### Test 3: Update KYC Data
- [ ] **Action**: Call `updateKYCVerification()` with new hashes
- [ ] **Expected**: Transaction succeeds, `KYCUpdated` event emitted
- [ ] **Verify**: New hashes are stored correctly

#### Test 4: Access Control
- [ ] **Action**: Try to call admin functions from non-owner address
- [ ] **Expected**: Transaction reverts with "Only owner can call this function"
- [ ] **Verify**: Only owner can store/delete/update

#### Test 5: Edge Cases
- [ ] **Test**: Empty userId - should revert
- [ ] **Test**: Zero hash - should revert
- [ ] **Test**: Delete non-existent record - should revert
- [ ] **Test**: Delete already deleted record - should revert

### B. KYB Contract Testing

#### Test 1: Store KYB Data
- [ ] **Action**: Call `storeKYBVerification()` with test data
- [ ] **Expected**: Transaction succeeds, `KYBStored` event emitted
- [ ] **Verify**: Check transaction on BSCScan Testnet
- [ ] **Verify**: Call `getKYBVerification()` - returns correct hashes
- [ ] **Verify**: Call `checkKYBStatus()` - returns `exists: true, approved: true, deleted: false`

**Test Script**:
```javascript
const kybContract = await ethers.getContractAt("KYBVerification", kybAddress);
const tx = await kybContract.storeKYBVerification(
  "test-org-123",
  "0x" + "1".repeat(64), // phoneHash
  "0x" + "2".repeat(64), // emailHash
  true // approved
);
await tx.wait();
console.log("✅ KYB stored:", tx.hash);
```

#### Test 2: Delete KYB Data
- [ ] **Action**: Call `deleteKYBVerification()` for the test org
- [ ] **Expected**: Transaction succeeds, `KYBDeleted` event emitted
- [ ] **Verify**: Call `getKYBVerification()` - returns zero hashes
- [ ] **Verify**: Call `checkKYBStatus()` - returns `exists: true, approved: true, deleted: true`

#### Test 3: Update KYB Data
- [ ] **Action**: Call `updateKYBVerification()` with new hashes
- [ ] **Expected**: Transaction succeeds, `KYBUpdated` event emitted

#### Test 4: Access Control
- [ ] **Action**: Try to call admin functions from non-owner address
- [ ] **Expected**: Transaction reverts

### C. Integration Testing with Backend

#### Test 1: KYC Approval Flow
- [ ] **Action**: Admin approves KYC in admin panel
- [ ] **Expected**: 
  - KYC stored on-chain automatically
  - Raw data deleted from Firebase
  - On-chain data automatically deleted
  - Firebase updated with both transaction hashes
- [ ] **Verify**: Check both transactions on BSCScan Testnet
- [ ] **Verify**: Firebase document has `onChainTxHash` and `onChainDeleteTxHash`
- [ ] **Verify**: Firebase document has `onChainDeleted: true`

**Test Steps**:
1. Submit KYC documents through frontend
2. Admin reviews and approves in `/admin/kyc`
3. Check console logs for on-chain operations
4. Verify transactions on BSCScan Testnet
5. Check Firebase document for deletion status

#### Test 2: KYB Approval Flow
- [ ] **Action**: Admin approves KYB in admin panel
- [ ] **Expected**: 
  - KYB stored on-chain automatically
  - Raw data deleted from Firebase
  - On-chain data automatically deleted
  - Firebase updated with both transaction hashes
- [ ] **Verify**: Check both transactions on BSCScan Testnet
- [ ] **Verify**: Firebase document has deletion status

#### Test 3: API Route Security
- [ ] **Test**: Call `/api/kyc/store-on-chain` without auth token
- [ ] **Expected**: Returns 401 Unauthorized
- [ ] **Test**: Call with non-admin token
- [ ] **Expected**: Returns 403 Forbidden
- [ ] **Test**: Call with valid admin token
- [ ] **Expected**: Returns 200 OK, transaction succeeds

#### Test 4: Rate Limiting
- [ ] **Test**: Make 10+ rapid requests to store-on-chain
- [ ] **Expected**: After 10 requests, returns 429 Rate Limit Exceeded

#### Test 5: Input Validation
- [ ] **Test**: Call API without required fields
- [ ] **Expected**: Returns 400 Bad Request with error message
- [ ] **Test**: Call with invalid userId
- [ ] **Expected**: Returns 404 Not Found

### D. Security Testing

#### Test 1: Authentication
- [ ] **Test**: All API routes require valid Bearer token
- [ ] **Test**: Invalid tokens are rejected
- [ ] **Test**: Expired tokens are rejected

#### Test 2: Authorization
- [ ] **Test**: Only admin role can call store/delete endpoints
- [ ] **Test**: Non-admin users get 403 Forbidden

#### Test 3: Data Isolation
- [ ] **Test**: User A cannot access User B's KYC data
- [ ] **Test**: Firestore rules prevent cross-user access
- [ ] **Test**: Each user's wallet data is isolated

#### Test 4: Audit Logging
- [ ] **Test**: All on-chain operations are logged
- [ ] **Test**: Security events are recorded in Firebase
- [ ] **Test**: Deletion events include admin ID and timestamp

### E. Frontend Testing

#### Test 1: Wallet Connection
- [ ] **Test**: Connect MetaMask to BSC Testnet
- [ ] **Test**: Switch network to BSC Testnet automatically
- [ ] **Test**: Display correct network name and chain ID

#### Test 2: Admin Panel
- [ ] **Test**: Admin can view KYC/KYB submissions
- [ ] **Test**: Admin can approve submissions
- [ ] **Test**: On-chain operations show in UI
- [ ] **Test**: Transaction links work correctly

#### Test 3: User Dashboard
- [ ] **Test**: Users can see their KYC/KYB status
- [ ] **Test**: On-chain verification status displays correctly
- [ ] **Test**: Deletion status is shown (if applicable)

---

## 📊 Test Results Documentation

Create a test results file: `TESTNET_TEST_RESULTS.md`

```markdown
# Testnet Test Results

## Deployment Date: [DATE]
## Testnet: BSC Testnet (Chain ID 97)

### Contract Addresses
- KYCVerification: 0x...
- KYBVerification: 0x...
- ProjectRegistry: 0x...

### Test Results

#### KYC Contract
- ✅ Store KYC: PASS
- ✅ Delete KYC: PASS
- ✅ Update KYC: PASS
- ✅ Access Control: PASS
- ✅ Edge Cases: PASS

#### KYB Contract
- ✅ Store KYB: PASS
- ✅ Delete KYB: PASS
- ✅ Update KYB: PASS
- ✅ Access Control: PASS

#### Integration Tests
- ✅ KYC Approval Flow: PASS
- ✅ KYB Approval Flow: PASS
- ✅ API Security: PASS
- ✅ Rate Limiting: PASS

#### Security Tests
- ✅ Authentication: PASS
- ✅ Authorization: PASS
- ✅ Data Isolation: PASS
- ✅ Audit Logging: PASS

### Issues Found
- [List any issues found during testing]

### Ready for Mainnet?
- [ ] YES - All tests passed
- [ ] NO - Issues need to be fixed
```

---

## 🔍 Verification Checklist

Before moving to mainnet, verify:

- [ ] All contract functions work correctly
- [ ] All events are emitted properly
- [ ] Access control is enforced
- [ ] Integration with backend works
- [ ] API security is functioning
- [ ] Frontend displays correct information
- [ ] No errors in console logs
- [ ] All transactions visible on BSCScan Testnet
- [ ] Gas costs are acceptable
- [ ] No security vulnerabilities found

---

## 🚨 Common Issues & Solutions

### Issue: "Insufficient funds"
**Solution**: Get more testnet BNB from faucet

### Issue: "Contract not verified"
**Solution**: Verify contracts on BSCScan Testnet

### Issue: "Transaction reverted"
**Solution**: Check contract logs, verify parameters

### Issue: "API returns 401"
**Solution**: Ensure auth token is valid and not expired

### Issue: "Rate limit exceeded"
**Solution**: Wait 1 minute between requests

---

## 📝 Next Steps After Testnet Testing

Once all tests pass:

1. ✅ Document all test results
2. ✅ Fix any issues found
3. ✅ Get final approval for mainnet deployment
4. ✅ Prepare mainnet deployment script
5. ✅ Set up mainnet environment variables
6. ✅ Deploy to BSC Mainnet
7. ✅ Verify contracts on BSCScan Mainnet
8. ✅ Update production environment variables
9. ✅ Monitor first few transactions

---

## 🔗 Testnet Resources

- **BSCScan Testnet**: https://testnet.bscscan.com
- **Testnet Faucet**: https://testnet.bnbchain.org/faucet-smart
- **Testnet Explorer**: https://testnet.bscscan.com
- **Testnet RPC**: https://data-seed-prebsc-1-s1.binance.org:8545

---

**✅ Complete all tests on testnet before deploying to mainnet!**


