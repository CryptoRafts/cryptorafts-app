# Testnet Deployment and Testing Guide

## 🎯 Updated Contract Structure

### KYC Contract
Stores **separate hashes** for:
- ✅ Front ID Card (hashed & salted)
- ✅ Back ID Card (hashed & salted)
- ✅ Proof of Address (hashed & salted)
- ✅ Live Snap/Selfie (hashed & salted)

### KYB Contract
Stores **separate hashes** for:
- ✅ Phone Number (hashed & salted)
- ✅ Email Address (hashed & salted)

---

## 🚀 Deployment Steps

### Step 1: Set Up Environment

Create `.env` file in project root:
```bash
PRIVATE_KEY=your_private_key_here
```

**⚠️ Important**: Use a test account with BNB testnet tokens!

### Step 2: Compile Contracts

```bash
npx hardhat compile
```

### Step 3: Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

**Expected Output:**
```
🚀 Deploying CryptoRafts Smart Contracts to BNB Chain...

📝 Deploying contracts with account: 0x...
💰 Account balance: ... wei

📄 Deploying KYCVerification contract...
✅ KYCVerification deployed to: 0x...

📄 Deploying KYBVerification contract...
✅ KYBVerification deployed to: 0x...

📄 Deploying ProjectRegistry contract...
✅ ProjectRegistry deployed to: 0x...

🎉 DEPLOYMENT COMPLETE!
```

### Step 4: Save Contract Addresses

The deployment script saves addresses to:
- `deployments/bscTestnet.json`

**Update your `.env.local`:**
```bash
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x...
```

---

## 🧪 Testing Contracts

### Run Test Script

```bash
npx hardhat run scripts/test-contracts.js --network bscTestnet
```

**What the test does:**
1. ✅ Creates test KYC data (front ID, back ID, proof, selfie)
2. ✅ Hashes and salts each document separately
3. ✅ Stores on-chain via KYC contract
4. ✅ Retrieves and verifies hashes match
5. ✅ Creates test KYB data (phone, email)
6. ✅ Hashes and salts phone and email
7. ✅ Stores on-chain via KYB contract
8. ✅ Retrieves and verifies hashes match

**Expected Output:**
```
🧪 Testing KYC and KYB Contracts on BSC Testnet...

🔐 Testing KYC Contract
📄 Hashing KYC documents...
💾 Storing KYC data on-chain...
✅ KYC data stored! Transaction: 0x...
🔍 Retrieving KYC data...
✅ All KYC hashes match!

🏢 Testing KYB Contract
📄 Hashing KYB data...
💾 Storing KYB data on-chain...
✅ KYB data stored! Transaction: 0x...
🔍 Retrieving KYB data...
✅ All KYB hashes match!

🎉 TEST SUMMARY
KYC Test: ✅ PASSED
KYB Test: ✅ PASSED
```

---

## 📋 Contract Functions

### KYC Contract

**Store KYC:**
```solidity
storeKYCVerification(
  string userId,
  bytes32 frontIdHash,
  bytes32 backIdHash,
  bytes32 proofOfAddressHash,
  bytes32 liveSnapHash,
  bool approved
)
```

**Get KYC:**
```solidity
getKYCVerification(string userId) returns (
  bytes32 frontIdHash,
  bytes32 backIdHash,
  bytes32 proofOfAddressHash,
  bytes32 liveSnapHash,
  bool approved,
  uint256 timestamp
)
```

### KYB Contract

**Store KYB:**
```solidity
storeKYBVerification(
  string userId,
  bytes32 phoneHash,
  bytes32 emailHash,
  bool approved
)
```

**Get KYB:**
```solidity
getKYBVerification(string userId) returns (
  bytes32 phoneHash,
  bytes32 emailHash,
  bool approved,
  uint256 timestamp
)
```

---

## 🔐 Hashing Process

### Frontend/Backend Flow:

1. **User submits KYC documents:**
   - Front ID card image
   - Back ID card image
   - Proof of address document
   - Live snap/selfie

2. **Backend processes:**
   ```typescript
   // Hash and salt each document
   const frontIdHash = hashAndSaltForBNBChain(frontIdData);
   const backIdHash = hashAndSaltForBNBChain(backIdData);
   const proofHash = hashAndSaltForBNBChain(proofOfAddressData);
   const liveSnapHash = hashAndSaltForBNBChain(selfieData);
   
   // Store on-chain
   await storeKYCOnBNBChain(
     frontIdHash.hash,
     backIdHash.hash,
     proofHash.hash,
     liveSnapHash.hash,
     userId,
     true, // approved
     adminSigner
   );
   ```

3. **On-chain storage:**
   - Each hash stored separately
   - Immutable record on BNB Chain
   - Raw data deleted from backend

---

## 🌐 View on Explorer

After deployment and testing, view transactions on:
- **BSC Testnet**: https://testnet.bscscan.com
- **BSC Mainnet**: https://bscscan.com

---

## ✅ Verification Checklist

- [ ] Contracts compiled successfully
- [ ] Contracts deployed to BSC Testnet
- [ ] Contract addresses saved to `.env.local`
- [ ] Test script runs successfully
- [ ] KYC hashes stored correctly
- [ ] KYB hashes stored correctly
- [ ] All hashes match on retrieval
- [ ] Transactions visible on BSCScan

---

## 🐛 Troubleshooting

### "Insufficient funds"
- Get BNB testnet tokens from: https://testnet.bnbchain.org/faucet-smart

### "Contract not found"
- Verify contract addresses in `.env.local`
- Check deployment file: `deployments/bscTestnet.json`

### "Hash mismatch"
- Verify hash conversion (hex to bytes32)
- Check salt generation is consistent

---

**Status**: Ready for testnet deployment and testing  
**Network**: BSC Testnet (Chain ID: 97)  
**Contracts**: KYCVerification, KYBVerification


