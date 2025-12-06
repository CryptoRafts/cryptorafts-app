# Mainnet Deployment Checklist

## ✅ Pre-Mainnet Requirements

**DO NOT deploy to mainnet until ALL testnet tests pass!**

---

## 📋 Pre-Deployment Checklist

### 1. Testnet Testing Complete
- [ ] All contracts deployed to BSC Testnet
- [ ] All contract functions tested and working
- [ ] Integration tests with backend completed
- [ ] API security tests passed
- [ ] Frontend integration tested
- [ ] All edge cases tested
- [ ] No critical bugs found
- [ ] Test results documented

### 2. Code Review
- [ ] Smart contracts reviewed by team
- [ ] Security audit completed (if applicable)
- [ ] All code changes committed
- [ ] Documentation updated

### 3. Environment Preparation
- [ ] Mainnet RPC endpoint configured
- [ ] Mainnet BNB obtained for gas fees
- [ ] Deployer wallet funded (recommend 0.5+ BNB)
- [ ] Admin wallet funded for operations
- [ ] Environment variables prepared

### 4. Security Verification
- [ ] Private keys secured (never commit to git)
- [ ] Multi-sig wallet considered for contract ownership
- [ ] Backup of deployer wallet secured
- [ ] Access control verified
- [ ] Rate limiting tested

---

## 🚀 Mainnet Deployment Steps

### Step 1: Final Verification

```bash
# Verify you're on mainnet
npx hardhat run scripts/verify-network.js --network bsc

# Check deployer balance
npx hardhat run scripts/check-balance.js --network bsc
```

### Step 2: Deploy Contracts

```bash
# Deploy to BSC Mainnet
npx hardhat run scripts/deploy-to-bnb.js --network bsc
```

**Expected Output**:
- Contract addresses
- Deployment transaction hashes
- BSCScan links

### Step 3: Verify Contracts

```bash
# Verify on BSCScan
npx hardhat verify --network bsc <KYC_CONTRACT_ADDRESS>
npx hardhat verify --network bsc <KYB_CONTRACT_ADDRESS>
npx hardhat verify --network bsc <PROJECT_CONTRACT_ADDRESS>
```

### Step 4: Update Environment Variables

Update `.env.local` and Vercel:

```env
# BSC Mainnet Contract Addresses
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x...

# BSC Mainnet RPC
NEXT_PUBLIC_BNB_CHAIN_RPC_URL=https://bsc-dataseed1.binance.org

# Admin Wallet (MAINNET)
ADMIN_WALLET_PRIVATE_KEY=your_mainnet_admin_wallet_key
```

### Step 5: Test on Mainnet

- [ ] Test KYC approval flow
- [ ] Test KYB approval flow
- [ ] Verify on-chain storage works
- [ ] Verify on-chain deletion works
- [ ] Check transaction costs
- [ ] Monitor for errors

---

## 🔐 Security Reminders

1. **Never share private keys**
2. **Use separate wallets for testnet and mainnet**
3. **Keep deployer wallet secure**
4. **Consider transferring ownership to multi-sig**
5. **Monitor first transactions closely**

---

## 📊 Post-Deployment

- [ ] Document mainnet addresses
- [ ] Update documentation
- [ ] Notify team of deployment
- [ ] Monitor transactions
- [ ] Set up alerts for errors

---

## 🚨 Rollback Plan

If issues are found:
1. Stop using affected contracts
2. Deploy new contracts if needed
3. Update environment variables
4. Notify users if necessary

---

**✅ Only proceed to mainnet after ALL testnet tests pass!**


