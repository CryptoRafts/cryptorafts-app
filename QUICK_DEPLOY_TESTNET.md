# Quick Deploy to Testnet

## 🚀 Fast Deployment

### 1. Set Private Key
```bash
# Create .env file
echo "PRIVATE_KEY=your_testnet_private_key_here" > .env
```

### 2. Compile
```bash
npx hardhat compile
```

### 3. Deploy
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### 4. Test
```bash
npx hardhat run scripts/test-contracts.js --network bscTestnet
```

---

## 📋 What Gets Deployed

### KYC Contract
- Stores: Front ID, Back ID, Proof of Address, Live Snap
- All hashed and salted separately

### KYB Contract  
- Stores: Phone Number, Email
- Both hashed and salted

---

## ✅ After Deployment

1. Copy contract addresses from output
2. Update `.env.local`:
   ```
   NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x...
   ```

3. Test contracts with test script

---

**Ready to deploy!** 🎯


