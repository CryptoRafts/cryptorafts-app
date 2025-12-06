# Complete Admin Wallet Setup Guide

## ✅ Automated Setup Complete!

Your admin wallet has been generated and configured locally.

---

## 📋 Wallet Information

- **Address**: 0x2A83b227B70e66749EA3C2CDE239D1A887cc4f77
- **Private Key**: d29c85ad15f9b9413117b5515b48ed574145ad82da14d40dbba29df95681faa8 (64 hex characters, no 0x)

---

## 🚀 Next Steps

### Step 1: Fund the Wallet

**For Testnet (Testing):**
1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Enter wallet address: 0x2A83b227B70e66749EA3C2CDE239D1A887cc4f77
3. Request testnet BNB (~0.1 BNB is enough)

**For Mainnet (Production):**
- Transfer BNB to: 0x2A83b227B70e66749EA3C2CDE239D1A887cc4f77
- Keep enough for gas fees

---

### Step 2: Add to Vercel

**Option A: Using Vercel CLI (Recommended)**

1. Install Vercel CLI (if not installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Add environment variable:
   ```bash
   vercel env add ADMIN_WALLET_PRIVATE_KEY production preview development
   ```
   
   When prompted, paste: `d29c85ad15f9b9413117b5515b48ed574145ad82da14d40dbba29df95681faa8`

4. Redeploy:
   ```bash
   vercel --prod
   ```

**Option B: Using Vercel Dashboard**

1. Go to: https://vercel.com/dashboard
2. Select project: `cryptorafts-starter`
3. Go to: **Settings** → **Environment Variables**
4. Click: **Add New**
5. Enter:
   - **Name**: `ADMIN_WALLET_PRIVATE_KEY`
   - **Value**: `d29c85ad15f9b9413117b5515b48ed574145ad82da14d40dbba29df95681faa8`
   - **Environments**: Select all (Production, Preview, Development)
6. Click: **Save**
7. Go to: **Deployments** → **Redeploy**

---

### Step 3: Verify Setup

Run the verification script:

```bash
npm run verify:admin-wallet
```

Should show:
```
✅ Admin Wallet Setup Verified!
✅ Wallet has sufficient balance
✅ Ready to use!
```

---

### Step 4: Test

1. Go to `/admin/kyc`
2. Approve a KYC document
3. Should work without errors! ✅

---

## 🔧 Files Created

- `.env.local` - Local environment variables (for development)
- `vercel-setup-commands.sh` - Vercel CLI commands
- This file - Complete setup guide

---

## ⚠️ Security Notes

- ✅ Private key is in `.env.local` (already in .gitignore)
- ⚠️ Never commit private keys to git
- ⚠️ Keep private key secure
- ⚠️ Use only for admin operations

---

## 🐛 Troubleshooting

### "Private key not found" error
- Check `.env.local` exists and contains `ADMIN_WALLET_PRIVATE_KEY`
- For Vercel: Check environment variable is set

### "Insufficient funds" error
- Fund wallet at: https://testnet.bnbchain.org/faucet-smart
- Address: 0x2A83b227B70e66749EA3C2CDE239D1A887cc4f77

### "Invalid format" error
- Private key must be 64 hex characters
- No `0x` prefix
- No spaces or line breaks

---

## ✅ Checklist

- [x] Wallet generated
- [x] .env.local created
- [ ] Wallet funded with testnet BNB
- [ ] Added to Vercel environment variables
- [ ] Vercel redeployed
- [ ] Verified with `npm run verify:admin-wallet`
- [ ] Tested KYC approval

---

**Status**: Local setup complete! ✅  
**Next**: Fund wallet and add to Vercel
