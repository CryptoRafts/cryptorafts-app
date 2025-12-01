# CryptoRafts Smart Contract Deployment Guide - BNB Chain

This guide covers deploying and using the CryptoRafts smart contracts on **BNB Smart Chain (BSC)**.

## 📋 Overview

The CryptoRafts platform uses three smart contracts deployed on **BNB Smart Chain (BSC)**:

1. **KYCVerification.sol** - Stores hashed KYC data for all user roles (founders, influencers, etc.)
2. **KYBVerification.sol** - Stores hashed email addresses for VCs and influencers
3. **ProjectRegistry.sol** - Stores hashed project data after successful funding/launch

**Primary Deployment Network**: BNB Smart Chain (BSC) - Chain ID 56

---

## 🚀 Prerequisites

1. **Node.js** 18+ installed
2. **Hardhat** installed (already in package.json)
3. **BNB** tokens in your wallet for gas fees
4. **Private Key** of admin wallet (keep secure!)

---

## 📦 Installation

All dependencies are already installed. If needed:

```bash
npm install
```

---

## 🔐 Environment Setup

1. Create `.env.local` (if not exists)
2. Add your admin wallet private key:

```env
# BNB Chain Deployment
PRIVATE_KEY=your_admin_wallet_private_key_here

# Contract addresses (will be populated after deployment)
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=
```

**⚠️ NEVER commit `.env.local` to version control!**

---

## 🏗️ Deployment Steps

### 1. Deploy to BSC Testnet (Recommended First)

```bash
# Deploy to BSC Testnet
npx hardhat run scripts/deploy.js --network bscTestnet
```

This will:
- Deploy all three contracts to BSC Testnet
- Save deployment addresses to `deployments/bscTestnet.json`
- Display contract addresses in console

### 2. Update Environment Variables

After deployment, update `.env.local` with the contract addresses:

```env
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x...
```

### 3. Deploy to BSC Mainnet

**⚠️ Only deploy to mainnet after thorough testing on testnet!**

```bash
# Deploy to BSC Mainnet
npx hardhat run scripts/deploy.js --network bsc
```

**Cost Estimate**: ~0.01-0.02 BNB per contract (3 contracts = ~0.03-0.06 BNB total)

---

## 📝 Contract Addresses

After deployment, contract addresses will be saved to:
- `deployments/bsc.json` (Mainnet)
- `deployments/bscTestnet.json` (Testnet)

Example:

```json
{
  "network": "bsc",
  "chainId": "56",
  "deployer": "0x...",
  "timestamp": "2025-01-XX...",
  "contracts": {
    "kycVerification": "0x...",
    "kybVerification": "0x...",
    "projectRegistry": "0x..."
  }
}
```

---

## 🔄 Automated Workflow

### KYC/KYB Storage Flow

1. **User submits KYC/KYB documents** (off-chain)
2. **Admin reviews and approves** (off-chain)
3. **Backend automatically**:
   - Hashes and salts sensitive data
   - Calls smart contract to store hash on BNB Chain
   - Deletes raw data from backend (after on-chain storage)

### Project Data Storage Flow

1. **Project is successfully funded**
2. **VCs/exchanges confirm launch date**
3. **Backend automatically**:
   - Hashes and salts full project data
   - Calls smart contract to store hash on BNB Chain
   - Deletes raw data from backend (after on-chain storage)

---

## 🔧 Backend Integration

### API Route Example

Create an API route (e.g., `src/app/api/kyc/store-on-chain/route.ts`) that:

1. Receives approval from admin
2. Hashes and salts the data
3. Calls the smart contract
4. Deletes raw data after successful on-chain storage

```typescript
import { ethers } from 'ethers';
import { storeKYCOnBNBChain, hashAndSaltForBNBChain } from '@/lib/bnb-chain-storage';

// Admin wallet (from environment)
const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY!;
const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BNB_RPC_URL);
const signer = new ethers.Wallet(adminPrivateKey, provider);

export async function POST(request: Request) {
  const { userId, kycData } = await request.json();
  
  // Hash and salt
  const { hash } = hashAndSaltForBNBChain(JSON.stringify(kycData));
  
  // Store on BNB Chain
  const txHash = await storeKYCOnBNBChain(hash, userId, true, signer);
  
  // Delete raw data from backend (Firebase/Firestore)
  // await deleteRawKYCData(userId);
  
  return Response.json({ txHash, success: true });
}
```

---

## ✅ Verification

### Verify Contract Deployment

1. Go to [BSCScan](https://bscscan.com) (mainnet) or [BSCScan Testnet](https://testnet.bscscan.com)
2. Search for your contract address
3. Verify contract source code (optional but recommended)

### Test Contract Functions

```bash
# Compile contracts
npx hardhat compile

# Run tests (if you create test files)
npx hardhat test
```

---

## 🔒 Security Notes

1. **Private Key Security**:
   - Never commit private keys to git
   - Use environment variables
   - Consider using hardware wallets for mainnet

2. **Contract Ownership**:
   - Only admin wallet can call storage functions
   - Ownership can be transferred if needed

3. **Data Hashing**:
   - Always hash and salt before on-chain storage
   - Never store raw sensitive data on-chain

---

## 📊 Gas Costs

Estimated gas costs on BNB Smart Chain:

- **Deploy KYCVerification**: ~1,500,000 gas (~0.01 BNB)
- **Deploy KYBVerification**: ~1,500,000 gas (~0.01 BNB)
- **Deploy ProjectRegistry**: ~2,000,000 gas (~0.015 BNB)
- **Store KYC/KYB**: ~100,000 gas (~0.0007 BNB)
- **Store Project Data**: ~150,000 gas (~0.001 BNB)

---

## 🆘 Troubleshooting

### "Insufficient funds"
- Ensure your wallet has enough BNB for gas fees

### "Contract address not configured"
- Check `.env.local` has contract addresses set
- Verify addresses match deployed contracts

### "Only owner can call this function"
- Ensure you're using the admin wallet (deployer address)
- Check contract ownership on BSCScan

---

## 📚 Additional Resources

- [BNB Chain Documentation](https://docs.bnbchain.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [BSCScan Explorer](https://bscscan.com)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

---

## ✅ Deployment Checklist

- [ ] Install dependencies
- [ ] Set up `.env.local` with private key
- [ ] Deploy to BSC Testnet
- [ ] Test all contract functions
- [ ] Update environment variables
- [ ] Deploy to BSC Mainnet
- [ ] Verify contracts on BSCScan
- [ ] Update `bnbconfig.json` with addresses
- [ ] Test backend integration
- [ ] Document contract addresses

---

**Primary Deployment Network**: BNB Smart Chain (BSC) - Chain ID 56

*Last Updated: January 2025*

