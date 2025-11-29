# KYC/KYB On-Chain Quick Start
## Fast Implementation Guide

---

## 🚀 Quick Setup (30 Minutes)

### **Step 1: Deploy Smart Contracts**

```bash
# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install ethers@^6.0.0 ipfs-http-client

# Initialize Hardhat
npx hardhat init

# Deploy contracts
npx hardhat run scripts/deploy-kyc-kyb.js --network sepolia
```

### **Step 2: Create Contract Files**

**contracts/KYCVerification.sol** - Copy from `KYC_KYB_ON_CHAIN_GUIDE.md`  
**contracts/KYBVerification.sol** - Copy from `KYC_KYB_ON_CHAIN_GUIDE.md`

### **Step 3: Deploy Script**

**scripts/deploy-kyc-kyb.js**

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy KYC Contract
  const KYCVerification = await hre.ethers.getContractFactory("CryptoRaftsKYCVerification");
  const verifierRole = deployer.address; // Set your verifier address
  const kyc = await KYCVerification.deploy(verifierRole);
  await kyc.waitForDeployment();
  console.log("KYC Contract deployed to:", await kyc.getAddress());

  // Deploy KYB Contract
  const KYBVerification = await hre.ethers.getContractFactory("CryptoRaftsKYBVerification");
  const kyb = await KYBVerification.deploy(verifierRole);
  await kyb.waitForDeployment();
  console.log("KYB Contract deployed to:", await kyb.getAddress());

  // Save addresses
  console.log("\nContract Addresses:");
  console.log("KYC:", await kyc.getAddress());
  console.log("KYB:", await kyb.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### **Step 4: Update Environment Variables**

**.env.local**

```env
NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_KYB_CONTRACT_ADDRESS=0x...
VERIFIER_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

---

## 💻 Frontend Integration

### **Step 1: Create On-Chain Service**

**src/lib/kyc-kyb-onchain/service.ts**

```typescript
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from './contracts';
import KYCABI from '@/abis/KYCVerification.json';
import KYBABI from '@/abis/KYBVerification.json';

export async function registerKYCOnChain(
  userAddress: string,
  userId: string,
  kycResult: any,
  signer: ethers.Signer
) {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.kyc,
    KYCABI,
    signer
  );

  const verificationHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(kycResult))
  );

  const tx = await contract.verifyKYC(
    userAddress,
    userId,
    verificationHash,
    ethers.ZeroHash, // documentHash
    kycResult.riskScore || 0,
    kycResult.status === 'verified',
    0 // no expiry
  );

  return await tx.wait();
}
```

### **Step 2: Update KYC API Route**

**src/app/api/kyc/verify/route.ts**

```typescript
import { processKYCWithOnChain } from '@/lib/kyc-kyb-onchain/integration';

export async function POST(req: NextRequest) {
  const { userId, userAddress, kycRequest } = await req.json();
  
  // Process KYC with on-chain registration
  const result = await processKYCWithOnChain(
    userId,
    userAddress,
    kycRequest
  );
  
  return NextResponse.json({ success: true, result });
}
```

### **Step 3: Check Verification Status**

**src/components/VerificationStatus.tsx**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { checkKYCStatus } from '@/lib/kyc-kyb-onchain/service';
import { useWeb3 } from '@/contexts/Web3Context';

export default function VerificationStatus() {
  const { address, provider } = useWeb3();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (address && provider) {
      checkKYCStatus(address, provider).then(setIsVerified);
    }
  }, [address, provider]);

  return (
    <div>
      {isVerified ? (
        <span className="text-green-500">✓ KYC Verified On-Chain</span>
      ) : (
        <span className="text-yellow-500">⏳ KYC Not Verified</span>
      )}
    </div>
  );
}
```

---

## 🔄 Integration Flow

```
1. User submits KYC documents
   ↓
2. RaftAI processes verification (off-chain)
   ↓
3. If verified, register on-chain
   ↓
4. Store transaction hash in Firebase
   ↓
5. Display verification status (on-chain + off-chain)
```

---

## ✅ Testing Checklist

- [ ] Deploy contracts to testnet
- [ ] Link wallet to user
- [ ] Process KYC verification
- [ ] Register on-chain
- [ ] Check verification status
- [ ] Sync status to Firebase
- [ ] Display verification badge

---

## 📚 Full Documentation

See [KYC_KYB_ON_CHAIN_GUIDE.md](./KYC_KYB_ON_CHAIN_GUIDE.md) for complete documentation.

---

**Status**: ✅ Quick Start Guide Complete











