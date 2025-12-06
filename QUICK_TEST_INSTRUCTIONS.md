# Quick Wallet Connection Test Instructions

## 🚀 Fast Testing Guide

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Open Test Page
Navigate to: **http://localhost:3000/test-wallet**

### Step 3: Test Wallet Connection

#### With Binance Wallet:
1. Install Binance Wallet extension
2. Refresh page
3. Should see: "🟡 Binance Wallet detected"
4. Click "Connect Wallet"
5. Approve in wallet
6. ✅ Should show your address

#### With MetaMask:
1. Install MetaMask extension
2. Refresh page  
3. Should see: "🦊 MetaMask detected"
4. Click "Connect Wallet"
5. Approve in MetaMask
6. ✅ Should show your address

---

## 🔍 What to Check

### ✅ Success Indicators:
- Wallet type detected correctly
- Connect button works
- Address appears after connection
- Network shows "BNB Smart Chain ✓" or switches automatically
- No errors in console

### ❌ Failure Indicators:
- Button stays disabled
- Error message appears
- No wallet detected
- Connection fails

---

## 🐛 Quick Debug

Open browser console (F12) and check:

```javascript
// Should return true if wallet installed
console.log('Binance:', !!window.BinanceChain);
console.log('MetaMask:', !!window.ethereum?.isMetaMask);
console.log('Ethereum:', !!window.ethereum);
```

---

## 📝 Test Results

After testing, note:
- [ ] Binance Wallet works: YES / NO
- [ ] MetaMask works: YES / NO  
- [ ] Network switching works: YES / NO
- [ ] Errors encountered: ___________

---

**Ready to test!** Start dev server and go to `/test-wallet`



