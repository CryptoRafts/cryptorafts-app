# Deploy Smart Contracts to BSC Testnet

This guide will help you deploy the CryptoRafts smart contracts to **BNB Smart Chain Testnet** and get the contract addresses.

## 🚀 Quick Start

### Step 1: Get Testnet BNB

You need testnet BNB for gas fees. Get it from the BSC Testnet Faucet:

1. Go to: https://testnet.binance.org/faucet-smart
2. Enter your wallet address
3. Request testnet BNB (you'll get 0.5 BNB for testing)

**Alternative Faucets:**
- https://www.bnbchain.org/en/testnet-faucet
- https://testnet.bnbchain.org/faucet-smart

### Step 2: Set Up Environment

1. Create or update `.env.local`:

```env
# Your wallet private key (for deployment)
PRIVATE_KEY=your_wallet_private_key_here

# Contract addresses (will be populated after deployment)
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=
```

**⚠️ NEVER commit `.env.local` to git!**

### Step 3: Compile Contracts

```bash
npx hardhat compile
```

### Step 4: Deploy to Testnet

```bash
npm run deploy:bsc-testnet
```

Or directly:

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Step 5: Get Contract Addresses

After deployment, you'll see:

```
🎉 DEPLOYMENT COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KYC Verification:    0x...
KYB Verification:    0x...
Project Registry:    0x...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The addresses are also saved to: `deployments/bscTestnet.json`

### Step 6: Update Environment Variables

Copy the contract addresses to your `.env.local`:

```env
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x...
```

### Step 7: Verify on BSCScan Testnet

1. Go to: https://testnet.bscscan.com
2. Search for your contract address
3. View contract details and transactions

---

## 📋 Example Deployment Output

```
🚀 Deploying CryptoRafts Smart Contracts to BNB Chain...

📝 Deploying contracts with account: 0xYourWalletAddress
💰 Account balance: 500000000000000000 wei

📄 Deploying KYCVerification contract...
✅ KYCVerification deployed to: 0x1234567890abcdef...

📄 Deploying KYBVerification contract...
✅ KYBVerification deployed to: 0xabcdef1234567890...

📄 Deploying ProjectRegistry contract...
✅ ProjectRegistry deployed to: 0x9876543210fedcba...

🎉 DEPLOYMENT COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KYC Verification:    0x1234567890abcdef...
KYB Verification:    0xabcdef1234567890...
Project Registry:    0x9876543210fedcba...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Deployment info saved to: deployments/bscTestnet.json

⚠️  IMPORTANT: Update your .env.local with these addresses:
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x1234567890abcdef...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0xabcdef1234567890...
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x9876543210fedcba...
```

---

## 🔍 View Deployment Info

After deployment, check the JSON file:

```bash
cat deployments/bscTestnet.json
```

Example content:

```json
{
  "network": "bscTestnet",
  "chainId": "97",
  "deployer": "0xYourWalletAddress",
  "timestamp": "2025-01-XX...",
  "contracts": {
    "kycVerification": "0x1234567890abcdef...",
    "kybVerification": "0xabcdef1234567890...",
    "projectRegistry": "0x9876543210fedcba..."
  }
}
```

---

## 🧪 Test the Contracts

### Test KYC Storage

1. Connect to testnet in your app
2. Use the API route: `POST /api/kyc/store-on-chain`
3. Check transaction on BSCScan Testnet

### Test Project Storage

1. Use the `storeProjectDataOnBNBChain()` function
2. Check transaction on BSCScan Testnet

---

## 💰 Gas Costs (Testnet)

- **Deploy KYC Contract**: ~0.001 testnet BNB
- **Deploy KYB Contract**: ~0.001 testnet BNB
- **Deploy Project Registry**: ~0.0015 testnet BNB
- **Store KYC/KYB**: ~0.0001 testnet BNB
- **Store Project Data**: ~0.00015 testnet BNB

---

## ⚠️ Troubleshooting

### "Insufficient funds"
- Get more testnet BNB from faucet
- Check wallet balance: https://testnet.bscscan.com

### "Private key not found"
- Make sure `PRIVATE_KEY` is set in `.env.local`
- Don't include `0x` prefix in private key

### "Network error"
- Check internet connection
- Try different RPC endpoint in `hardhat.config.js`

---

## 📚 Next Steps

After successful testnet deployment:

1. ✅ Test all contract functions
2. ✅ Verify contracts work with your backend
3. ✅ Test data storage and retrieval
4. ✅ Deploy to BSC Mainnet when ready

---

**Testnet Network**: BNB Smart Chain Testnet (Chain ID: 97)  
**Explorer**: https://testnet.bscscan.com  
**Faucet**: https://testnet.binance.org/faucet-smart

