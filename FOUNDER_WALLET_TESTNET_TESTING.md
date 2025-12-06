# Founder Wallet Connection - Testnet Testing Guide

## ✅ Configuration Updated

**Current Setup:**
- ✅ Wallet connection integrated in founder registration flow
- ✅ Configured for **BSC Testnet** (Chain ID: 97) for testing
- ✅ Supports Binance Wallet and MetaMask
- ✅ Dynamic import to avoid SSR issues
- ✅ Only available for founders (in `/founder/register` page)

---

## 🧪 Testing Steps

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Test Founder Registration Flow

1. **Navigate to**: `http://localhost:3000/founder/register`
2. **Complete Profile Form**:
   - Fill in all required fields (name, email, company, etc.)
   - Upload profile photo (optional)
   - Click "Save Profile & Connect Wallet"

3. **Wallet Connection Step**:
   - After saving profile, wallet connection section appears
   - Should show: "Connect Your Wallet"
   - Should detect Binance Wallet or MetaMask

4. **Connect Wallet**:
   - Click "Connect Wallet" button
   - Approve connection in wallet popup
   - **Expected**: Network switches to BSC Testnet (Chain ID: 97)
   - **Expected**: Wallet address appears
   - **Expected**: Redirects to KYC page after 1 second

---

## 🔍 What to Verify

### ✅ Success Indicators:
- [ ] Profile form saves successfully
- [ ] Wallet connection section appears after form submission
- [ ] Wallet is detected (Binance Wallet or MetaMask)
- [ ] "Connect Wallet" button is enabled
- [ ] Connection popup appears
- [ ] Network switches to BSC Testnet (Chain ID: 97)
- [ ] Wallet address is displayed
- [ ] Address is saved to user profile in Firebase
- [ ] Redirects to `/founder/kyc` page
- [ ] No console errors

### ❌ Failure Indicators:
- [ ] Wallet connection section doesn't appear
- [ ] Wallet not detected
- [ ] Connection fails
- [ ] Network doesn't switch
- [ ] Address not saved
- [ ] Errors in console

---

## 🌐 Network Configuration

**Current Testnet Settings:**
- **Network**: BNB Smart Chain Testnet
- **Chain ID**: 97
- **RPC URLs**: 
  - `https://data-seed-prebsc-1-s1.binance.org:8545`
  - `https://data-seed-prebsc-2-s1.binance.org:8545`
- **Block Explorer**: `https://testnet.bscscan.com`

**To Switch to Mainnet (after testing):**
Edit `src/lib/bnb-chain.ts`:
```typescript
// Change from:
export const PRIMARY_BNB_CHAIN = BNB_CHAIN_NETWORKS.bscTestnet;

// To:
export const PRIMARY_BNB_CHAIN = BNB_CHAIN_NETWORKS.bsc;
```

---

## 🐛 Troubleshooting

### Wallet Not Detected
- Check browser console for errors
- Verify wallet extension is installed and enabled
- Try refreshing the page
- Check if wallet is unlocked

### Network Switch Fails
- User may need to manually add BSC Testnet to wallet
- Check if wallet supports network switching
- Verify RPC URLs are accessible

### Connection Fails
- Check browser console for error messages
- Verify wallet is unlocked
- Try disconnecting and reconnecting
- Check if popup blockers are interfering

### Address Not Saved
- Check Firebase console for errors
- Verify user is authenticated
- Check browser console for API errors

---

## 📝 Test Checklist

### Profile Registration
- [ ] Form validation works
- [ ] Photo upload works
- [ ] Form submission saves to Firebase
- [ ] Wallet connection step appears

### Wallet Connection
- [ ] Binance Wallet detected
- [ ] MetaMask detected
- [ ] Connection popup appears
- [ ] Network switches to BSC Testnet
- [ ] Address displayed correctly
- [ ] Address saved to Firebase
- [ ] Redirects to KYC page

### Error Handling
- [ ] No wallet error message shows
- [ ] Connection rejection handled
- [ ] Network switch failure handled
- [ ] Firebase errors handled

---

## 🔄 Flow Diagram

```
Founder Registration
    ↓
Fill Profile Form
    ↓
Save Profile (Firebase)
    ↓
Show Wallet Connection
    ↓
Connect Wallet (Binance/MetaMask)
    ↓
Switch to BSC Testnet (Chain ID: 97)
    ↓
Save Wallet Address (Firebase)
    ↓
Redirect to KYC Page
```

---

## 📊 Expected Console Logs

**On Page Load:**
```
🔍 Checking for wallet...
🟡 Binance Wallet detected
// OR
🦊 MetaMask detected
```

**On Connection:**
```
🔗 Connecting to Binance Wallet...
✅ Binance Wallet connected: 0x... Chain ID: 97
🌐 Switching to BNB Smart Chain Testnet...
✅ Network switched successfully
💾 Saving wallet address to profile...
✅ Wallet address saved
```

---

## 🚀 Quick Test

1. Go to: `http://localhost:3000/founder/register`
2. Fill form and submit
3. Connect wallet when prompted
4. Verify network is BSC Testnet (97)
5. Check address is saved
6. Verify redirect to KYC

---

**Status**: Ready for testnet testing  
**Network**: BSC Testnet (Chain ID: 97)  
**Component**: `BinanceWalletConnect.tsx`  
**Page**: `/founder/register`

*Test and report any issues before switching to mainnet*


