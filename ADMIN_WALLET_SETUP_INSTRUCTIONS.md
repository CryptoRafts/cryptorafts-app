# Admin Wallet Setup Instructions

## Generated Wallet
- **Address**: 0xDA7d7DD2825b24377Af3a1cAF82ec7867544667a
- **Private Key**: e14e4e7f62fac0bf5eb601cc200f269ce47b7de5cc71b84ae910cef3bb465645 (64 hex characters, no 0x)

## Step 1: Add to Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select project: cryptorafts-starter
3. Go to: Settings → Environment Variables
4. Click: Add New
5. Enter:
   - Name: ADMIN_WALLET_PRIVATE_KEY
   - Value: e14e4e7f62fac0bf5eb601cc200f269ce47b7de5cc71b84ae910cef3bb465645
   - Environments: Production, Preview, Development (select all)
6. Click: Save

## Step 2: Fund the Wallet

### For Testnet (Testing):
1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Enter wallet address: 0xDA7d7DD2825b24377Af3a1cAF82ec7867544667a
3. Request testnet BNB (~0.1 BNB is enough)

### For Mainnet (Production):
- Transfer BNB to: 0xDA7d7DD2825b24377Af3a1cAF82ec7867544667a
- Keep enough for gas fees

## Step 3: Redeploy

After adding the environment variable:
- Option A: Push a new commit (triggers auto-deployment)
- Option B: Vercel Dashboard → Deployments → Redeploy

## Step 4: Verify

1. Go to /admin/kyc
2. Approve a KYC document
3. Check console - should NOT see "Admin wallet not configured" error
4. Transaction should be stored on-chain

## Security Notes

⚠️ **IMPORTANT**:
- Keep this private key secure
- Never commit it to git
- Use only for admin operations
- This is a dedicated admin wallet

## Next Steps

1. Copy the private key above
2. Add to Vercel environment variables
3. Fund the wallet
4. Redeploy
5. Test KYC approval

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
