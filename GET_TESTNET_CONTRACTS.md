# How to Get Smart Contract Addresses on BSC Testnet

## Quick Steps

1. **Get Testnet BNB** (for gas fees)
   - Visit: https://testnet.binance.org/faucet-smart
   - Enter your wallet address
   - Request 0.5 testnet BNB

2. **Set Private Key** in `.env.local`:
   ```env
   PRIVATE_KEY=your_wallet_private_key_here
   ```

3. **Deploy Contracts**:
   ```bash
   npm run deploy:bsc-testnet
   ```

4. **Get Addresses** from the output or `deployments/bscTestnet.json`

---

## Contract Addresses Format

After deployment, you'll get addresses like:

```
KYC Verification:    0x1234567890abcdef1234567890abcdef12345678
KYB Verification:    0xabcdef1234567890abcdef1234567890abcdef12
Project Registry:    0x9876543210fedcba9876543210fedcba98765432
```

---

## Where to Find Addresses

1. **Console Output** - Displayed after deployment
2. **deployments/bscTestnet.json** - Saved automatically
3. **BSCScan Testnet** - Search your deployer address

---

## Update Your App

Add to `.env.local`:

```env
NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=0x...
```

---

**Ready to deploy? Run: `npm run deploy:bsc-testnet`**



