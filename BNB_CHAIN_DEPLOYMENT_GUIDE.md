# BNB Chain Smart Contract Deployment Guide

## 🌐 Network Configuration

**Primary Deployment Network**: BNB Smart Chain (BSC)
- **Chain ID**: 56
- **Network Name**: BNB Smart Chain (BSC)
- **RPC Endpoints**:
  - `https://bsc-dataseed1.binance.org`
  - `https://bsc-dataseed2.binance.org`
  - `https://bsc-dataseed1.defibit.io`
  - `https://bsc-dataseed1.nodereal.io`
- **Block Explorer**: `https://bscscan.com`
- **Native Currency**: BNB (18 decimals)

**Testnet for Development**: BSC Testnet
- **Chain ID**: 97
- **RPC Endpoints**:
  - `https://data-seed-prebsc-1-s1.binance.org:8545`
  - `https://data-seed-prebsc-2-s1.binance.org:8545`
- **Block Explorer**: `https://testnet.bscscan.com`

---

## 📋 Smart Contracts to Deploy

### 1. KYCVerification.sol
**Purpose**: Store hashed KYC data on BNB Chain with deletion support

**Key Features**:
- Stores hashed KYC documents (Front ID, Back ID, Proof of Address, Live Snap)
- Supports deletion/invalidation for user privacy
- Admin-only functions for security
- Audit trail with timestamps and admin addresses

**File**: `contracts/KYCVerification.sol`

### 2. KYBVerification.sol
**Purpose**: Store hashed KYB data on BNB Chain with deletion support

**Key Features**:
- Stores hashed phone and email for business verification
- Supports deletion/invalidation for user privacy
- Admin-only functions for security
- Audit trail with timestamps and admin addresses

**File**: `contracts/KYBVerification.sol`

### 3. ProjectRegistry.sol
**Purpose**: Store hashed project data after successful funding/launch

**Key Features**:
- Stores hashed project data (pitch, deal flow, funding info)
- Tracks launch dates and project status
- Admin-only functions for security

**File**: `contracts/ProjectRegistry.sol`

---

## 🚀 Deployment Steps

### Prerequisites

1. **Install Hardhat or Foundry**:
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   # OR
   npm install --save-dev foundry
   ```

2. **Get BNB for Gas Fees**:
   - Mainnet: Purchase BNB from an exchange
   - Testnet: Get testnet BNB from https://testnet.bnbchain.org/faucet-smart

3. **Set Up Environment Variables**:
   Create `.env` file:
   ```env
   # BNB Chain RPC
   BNB_CHAIN_RPC_URL=https://bsc-dataseed1.binance.org
   
   # Deployer Private Key (NEVER commit this!)
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   
   # Network Configuration
   NETWORK=bsc  # or bscTestnet for testnet
   ```

### Deployment Script (Hardhat)

Create `scripts/deploy-to-bnb.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying CryptoRafts contracts to BNB Chain...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

  // Deploy KYCVerification
  console.log("📄 Deploying KYCVerification contract...");
  const KYCVerification = await ethers.getContractFactory("KYCVerification");
  const kycContract = await KYCVerification.deploy();
  await kycContract.waitForDeployment();
  const kycAddress = await kycContract.getAddress();
  console.log("✅ KYCVerification deployed to:", kycAddress);
  console.log("🔗 View on BSCScan:", `https://bscscan.com/address/${kycAddress}\n`);

  // Deploy KYBVerification
  console.log("📄 Deploying KYBVerification contract...");
  const KYBVerification = await ethers.getContractFactory("KYBVerification");
  const kybContract = await KYBVerification.deploy();
  await kybContract.waitForDeployment();
  const kybAddress = await kybContract.getAddress();
  console.log("✅ KYBVerification deployed to:", kybAddress);
  console.log("🔗 View on BSCScan:", `https://bscscan.com/address/${kybAddress}\n`);

  // Deploy ProjectRegistry
  console.log("📄 Deploying ProjectRegistry contract...");
  const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
  const projectContract = await ProjectRegistry.deploy();
  await projectContract.waitForDeployment();
  const projectAddress = await projectContract.getAddress();
  console.log("✅ ProjectRegistry deployed to:", projectAddress);
  console.log("🔗 View on BSCScan:", `https://bscscan.com/address/${projectAddress}\n`);

  // Save addresses to file
  const addresses = {
    network: "BNB Smart Chain (BSC)",
    chainId: 56,
    deployer: deployer.address,
    contracts: {
      kycVerification: kycAddress,
      kybVerification: kybAddress,
      projectRegistry: projectAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  console.log("📋 Contract Addresses:");
  console.log(JSON.stringify(addresses, null, 2));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n✅ Deployment addresses saved to deployment-addresses.json");

  console.log("\n🎉 All contracts deployed successfully to BNB Chain!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Hardhat Configuration

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bsc: {
      url: process.env.BNB_CHAIN_RPC_URL || "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 5000000000, // 5 gwei
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 10000000000, // 10 gwei
    },
  },
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
    },
  },
};
```

### Deploy Commands

```bash
# Deploy to BSC Testnet (for testing)
npx hardhat run scripts/deploy-to-bnb.js --network bscTestnet

# Deploy to BSC Mainnet (production)
npx hardhat run scripts/deploy-to-bnb.js --network bsc

# Verify contracts on BSCScan
npx hardhat verify --network bsc <CONTRACT_ADDRESS>
```

---

## 🔐 Post-Deployment Setup

### 1. Update Environment Variables

After deployment, update your `.env.local` file:

```env
# BNB Chain Contract Addresses
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x...

# BNB Chain RPC
NEXT_PUBLIC_BNB_CHAIN_RPC_URL=https://bsc-dataseed1.binance.org

# Admin Wallet (for on-chain operations)
ADMIN_WALLET_PRIVATE_KEY=your_admin_wallet_private_key
```

### 2. Update Vercel Environment Variables

Add the contract addresses to your Vercel project:
- Go to Project Settings → Environment Variables
- Add all `NEXT_PUBLIC_BNB_*` variables
- Add `ADMIN_WALLET_PRIVATE_KEY` (as a secret)

### 3. Verify Contract Ownership

After deployment, verify that the deployer address is the contract owner:
```javascript
const kycContract = await ethers.getContractAt("KYCVerification", kycAddress);
const owner = await kycContract.owner();
console.log("Contract owner:", owner);
```

---

## 🔍 Contract Verification on BSCScan

### Automatic Verification

```bash
# Verify KYCVerification
npx hardhat verify --network bsc <KYC_CONTRACT_ADDRESS>

# Verify KYBVerification
npx hardhat verify --network bsc <KYB_CONTRACT_ADDRESS>

# Verify ProjectRegistry
npx hardhat verify --network bsc <PROJECT_CONTRACT_ADDRESS>
```

### Manual Verification

1. Go to https://bscscan.com/verifyContract
2. Enter contract address
3. Select compiler version: `0.8.24`
4. Select optimization: `Yes` (200 runs)
5. Paste contract source code
6. Submit for verification

---

## 📊 Contract Functions

### KYCVerification Contract

**Public Functions**:
- `storeKYCVerification(userId, frontIdHash, backIdHash, proofHash, liveSnapHash, approved)` - Store KYC data
- `deleteKYCVerification(userId)` - Mark KYC data as deleted
- `getKYCVerification(userId)` - Get KYC data (returns zeros if deleted)
- `checkKYCStatus(userId)` - Check if user has KYC and if it's deleted

**Events**:
- `KYCStored` - Emitted when KYC is stored
- `KYCDeleted` - Emitted when KYC is deleted
- `KYCUpdated` - Emitted when KYC is updated

### KYBVerification Contract

**Public Functions**:
- `storeKYBVerification(userId, phoneHash, emailHash, approved)` - Store KYB data
- `deleteKYBVerification(userId)` - Mark KYB data as deleted
- `getKYBVerification(userId)` - Get KYB data (returns zeros if deleted)
- `checkKYBStatus(userId)` - Check if user has KYB and if it's deleted

**Events**:
- `KYBStored` - Emitted when KYB is stored
- `KYBDeleted` - Emitted when KYB is deleted
- `KYBUpdated` - Emitted when KYB is updated

---

## 💰 Gas Cost Estimates

**Deployment Costs** (approximate):
- KYCVerification: ~1,500,000 gas (~$0.15 at 5 gwei)
- KYBVerification: ~1,200,000 gas (~$0.12 at 5 gwei)
- ProjectRegistry: ~1,800,000 gas (~$0.18 at 5 gwei)

**Transaction Costs** (approximate):
- Store KYC: ~150,000 gas (~$0.015)
- Delete KYC: ~80,000 gas (~$0.008)
- Store KYB: ~120,000 gas (~$0.012)
- Delete KYB: ~70,000 gas (~$0.007)

*Note: Gas costs vary based on network congestion*

---

## 🛡️ Security Considerations

1. **Private Key Security**:
   - Never commit private keys to version control
   - Use environment variables or secure key management
   - Consider using a hardware wallet for mainnet deployment

2. **Contract Ownership**:
   - The deployer becomes the contract owner
   - Only the owner can call admin functions
   - Consider transferring ownership to a multisig wallet

3. **Access Control**:
   - All storage/deletion functions are `onlyOwner`
   - Ensure the owner address is secure and backed up

4. **Testing**:
   - Always test on BSC Testnet first
   - Verify all functions work correctly
   - Test deletion functionality

---

## 📝 Next Steps

1. ✅ Deploy contracts to BSC Testnet
2. ✅ Test all functions on testnet
3. ✅ Verify contracts on BSCScan
4. ✅ Update environment variables
5. ✅ Deploy to BSC Mainnet
6. ✅ Update production environment variables
7. ✅ Test end-to-end flow with real transactions

---

## 🔗 Useful Links

- **BSCScan**: https://bscscan.com
- **BSC Testnet Faucet**: https://testnet.bnbchain.org/faucet-smart
- **BNB Chain Docs**: https://docs.bnbchain.org
- **Hardhat Docs**: https://hardhat.org/docs
- **Ethers.js Docs**: https://docs.ethers.org

---

**🎉 Your smart contracts are ready for BNB Chain deployment!**


